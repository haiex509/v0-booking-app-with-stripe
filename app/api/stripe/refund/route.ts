import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, bookingId, reason, amount } = await req.json()

    if (!paymentIntentId && !bookingId) {
      return NextResponse.json({ error: "Payment Intent ID or Booking ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Get booking details from database
    let booking
    if (bookingId) {
      const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single()

      if (error || !data) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
      }
      booking = data
    } else {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("payment_intent_id", paymentIntentId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
      }
      booking = data
    }

    // Check if already refunded
    if (booking.status === "refunded") {
      return NextResponse.json({ error: "Booking has already been refunded" }, { status: 400 })
    }

    // Process refund through Stripe
    const refundAmount = amount || booking.price * 100 // Convert to cents if full refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
    })

    // Update booking in database with refund details
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "refunded",
        refund_id: refund.id,
        refund_amount: refundAmount / 100, // Convert back to dollars
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating booking:", updateError)
      // Refund was processed but database update failed
      return NextResponse.json({
        success: true,
        warning: "Refund processed but database update failed",
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
        },
      })
    }

    console.log("[v0] Refund processed successfully for booking:", booking.id)
    console.log("[v0] Time slot now available:", booking.booking_date, booking.booking_time)

    return NextResponse.json({
      success: true,
      message: "Refund processed and booking slot is now available",
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
      booking: updatedBooking,
    })
  } catch (error: unknown) {
    console.error("Error processing refund:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process refund",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const bookingId = req.nextUrl.searchParams.get("booking_id")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      booking,
      canRefund: booking.status === "confirmed" && !booking.refund_id,
      refundDetails: booking.refund_id
        ? {
            refundId: booking.refund_id,
            refundAmount: booking.refund_amount,
            refundReason: booking.refund_reason,
            refundedAt: booking.refunded_at,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching refund details:", error)
    return NextResponse.json({ error: "Failed to fetch refund details" }, { status: 500 })
  }
}
