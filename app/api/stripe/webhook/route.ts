import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("[v0] Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("[v0] Webhook event received:", event.type)

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
  console.log("[v0] Processing checkout.session.completed:", session.id)

  const supabase = await getSupabaseServerClient()
  const bookingData = JSON.parse(session.metadata?.bookingData || "{}")

  try {
    let customerId: string | null = null
    const customerEmail = session.customer_details?.email || bookingData.customerEmail

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log("[v0] Found existing customer:", customerId)
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            name: session.customer_details?.name || bookingData.customerName,
            email: customerEmail,
            phone: session.customer_details?.phone || bookingData.customerPhone,
          },
        ])
        .select()
        .single()

      if (customerError) {
        console.error("[v0] Error creating customer:", customerError)
      } else {
        customerId = newCustomer.id
        console.log("[v0] Created new customer:", customerId)
      }
    }

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle()

    let bookingId: string

    if (existingBooking) {
      // Update existing booking
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
        console.error("[v0] Error updating booking:", updateError)
        throw updateError
      }

      bookingId = updatedBooking.id
      console.log("[v0] Updated existing booking:", bookingId)
    } else {
      // Create new booking
      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            booking_date: bookingData.date,
            booking_time: bookingData.time,
            customer_name: session.customer_details?.name || bookingData.customerName,
            customer_email: customerEmail,
            customer_phone: session.customer_details?.phone || bookingData.customerPhone,
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
        console.error("[v0] Error creating booking:", bookingError)
        throw bookingError
      }

      bookingId = newBooking.id
      console.log("[v0] Created new booking:", bookingId)
    }

    const { error: paymentError } = await supabase.from("payments").insert([
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
        customer_name: session.customer_details?.name || bookingData.customerName,
        metadata: bookingData,
      },
    ])

    if (paymentError) {
      console.error("[v0] Error creating payment record:", paymentError)
    } else {
      console.log("[v0] Payment record created for booking:", bookingId)
    }

    if (customerId) {
      await supabase.rpc("update_customer_stats", { p_customer_id: customerId })
    }

    console.log("[v0] Checkout completed successfully for booking:", bookingId)
  } catch (error) {
    console.error("[v0] Error in handleCheckoutCompleted:", error)
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

  await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: "Payment failed" })
    .eq("payment_intent_id", paymentIntent.id)

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

    console.log("[v0] Refund processed for payment:", charge.payment_intent)
  }
}
