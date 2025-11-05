import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendBookingConfirmation, sendPaymentFailedEmail, sendRefundNotification } from "@/lib/email-service"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("[v0] Missing stripe-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    let event: Stripe.Event

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error("[v0] Webhook signature verification failed:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    } else {
      console.warn("[v0] STRIPE_WEBHOOK_SECRET not set - skipping signature verification (development only)")
      event = JSON.parse(body)
    }

    console.log("[v0] ===== WEBHOOK EVENT RECEIVED =====")
    console.log("[v0] Event type:", event.type)
    console.log("[v0] Event ID:", event.id)

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge)
        break
      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[v0] ===== PROCESSING CHECKOUT COMPLETED =====")
  console.log("[v0] Session ID:", session.id)
  console.log("[v0] Payment Intent:", session.payment_intent)
  console.log("[v0] Amount Total:", session.amount_total)

  const supabase = await getSupabaseServerClient()
  const bookingData = JSON.parse(session.metadata?.bookingData || "{}")

  console.log("[v0] Booking data from metadata:", bookingData)

  try {
    let customerId: string | null = null
    const customerEmail = session.customer_details?.email || bookingData.customerEmail
    const customerName = session.customer_details?.name || bookingData.customerName
    const customerPhone = session.customer_details?.phone || bookingData.customerPhone

    console.log("[v0] Looking for existing customer with email:", customerEmail)

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log("[v0] ✓ Found existing customer:", customerId)
    } else {
      console.log("[v0] Creating new customer...")
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
        ])
        .select()
        .single()

      if (customerError) {
        console.error("[v0] ✗ Error creating customer:", customerError)
        throw customerError
      } else {
        customerId = newCustomer.id
        console.log("[v0] ✓ Created new customer:", customerId)
      }
    }

    console.log("[v0] Checking for existing booking with session_id:", session.id)

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("stripe_session_id", session.id)
      .maybeSingle()

    let bookingId: string
    let finalBooking: any

    if (existingBooking) {
      console.log("[v0] Found existing booking:", existingBooking.id, "Status:", existingBooking.status)

      const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          customer_id: customerId,
          payment_intent_id: session.payment_intent as string,
        })
        .eq("id", existingBooking.id)
        .select()
        .single()

      if (updateError) {
        console.error("[v0] ✗ Error updating booking:", updateError)
        throw updateError
      }

      bookingId = updatedBooking.id
      finalBooking = updatedBooking
      console.log("[v0] ✓ Updated booking to confirmed:", bookingId)
    } else {
      console.log("[v0] No existing booking found, creating new one...")

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_id: customerId,
            package_id: bookingData.packageId,
            price: (session.amount_total || 0) / 100,
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            payment_intent_id: session.payment_intent as string,
            stripe_session_id: session.id,
          },
        ])
        .select()
        .single()

      if (bookingError) {
        console.error("[v0] ✗ Error creating booking:", bookingError)
        throw bookingError
      }

      bookingId = newBooking.id
      finalBooking = newBooking
      console.log("[v0] ✓ Created new booking:", bookingId)
    }

    console.log("[v0] Creating payment record...")

    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          booking_id: bookingId,
          customer_id: customerId,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_session_id: session.id,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || "usd",
          status: "succeeded",
          payment_method: session.payment_method_types?.[0],
          customer_email: customerEmail,
          customer_name: customerName,
          metadata: bookingData,
        },
      ])
      .select()
      .single()

    if (paymentError) {
      console.error("[v0] ✗ Error creating payment record:", paymentError)
      throw paymentError
    } else {
      console.log("[v0] ✓ Payment record created:", paymentData.id)
    }

    if (customerId) {
      console.log("[v0] Updating customer statistics...")

      const { error: statsError } = await supabase.rpc("update_customer_stats", {
        p_customer_id: customerId,
      })

      if (statsError) {
        console.error("[v0] ✗ Error updating customer stats:", statsError)
      } else {
        console.log("[v0] ✓ Customer statistics updated")
      }
    }

    console.log("[v0] Sending booking confirmation email...")
    await sendBookingConfirmation({
      customerName: customerName,
      customerEmail: customerEmail,
      serviceName: bookingData.serviceName || "Booking Service",
      bookingDate: finalBooking.booking_date,
      bookingTime: finalBooking.booking_time,
      price: finalBooking.price,
      bookingId: bookingId,
    })

    console.log("[v0] ===== CHECKOUT COMPLETED SUCCESSFULLY =====")
    console.log("[v0] Booking ID:", bookingId)
    console.log("[v0] Customer ID:", customerId)
    console.log("[v0] Payment ID:", paymentData.id)
  } catch (error) {
    console.error("[v0] ===== ERROR IN CHECKOUT COMPLETION =====")
    console.error("[v0] Error details:", error)
    throw error
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("[v0] Processing payment_intent.succeeded:", paymentIntent.id)

  const supabase = await getSupabaseServerClient()

  // Update payment record
  await supabase.from("payments").update({ status: "succeeded" }).eq("stripe_payment_intent_id", paymentIntent.id)

  console.log("[v0] Payment succeeded:", paymentIntent.id)
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("[v0] Processing payment_intent.payment_failed:", paymentIntent.id)

  const supabase = await getSupabaseServerClient()

  // Update payment and booking status
  await supabase.from("payments").update({ status: "failed" }).eq("stripe_payment_intent_id", paymentIntent.id)

  const { data: booking } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: "Payment failed" })
    .eq("payment_intent_id", paymentIntent.id)
    .select()
    .single()

  if (booking) {
    console.log("[v0] Sending payment failed email...")
    await sendPaymentFailedEmail({
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      serviceName: "Booking Service",
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      price: booking.price,
      bookingId: booking.id,
    })
  }

  console.log("[v0] Payment failed:", paymentIntent.id)
}

async function handleRefund(charge: Stripe.Charge) {
  console.log("[v0] Processing charge.refunded:", charge.id)

  const supabase = await getSupabaseServerClient()

  if (charge.payment_intent) {
    await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", charge.payment_intent as string)

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("payment_intent_id", charge.payment_intent as string)
      .single()

    if (booking) {
      console.log("[v0] Sending refund notification email...")
      await sendRefundNotification({
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        serviceName: "Booking Service",
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        refundAmount: booking.refund_amount || booking.price,
        originalAmount: booking.price,
        bookingId: booking.id,
      })
    }

    console.log("[v0] Refund processed for payment:", charge.payment_intent)
  }
}
