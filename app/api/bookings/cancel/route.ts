import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: NextRequest) {
  try {
    const { bookingId, refundType, reason } = await req.json()

    if (!bookingId || !reason) {
      return NextResponse.json({ error: "Booking ID and reason are required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Get the current user (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status === "cancelled" || booking.status === "refunded") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 })
    }

    let refundAmount = 0
    let refundStatus = "none"

    // Process refund if requested
    if (refundType !== "none" && booking.payment_intent_id) {
      try {
        const refundAmountCents = refundType === "full" ? booking.amount * 100 : booking.amount * 50 // 50% for partial

        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: Math.round(refundAmountCents),
          reason: "requested_by_customer",
          metadata: {
            booking_id: bookingId,
            cancelled_by: user.id,
            cancellation_reason: reason,
          },
        })

        refundAmount = refund.amount / 100
        refundStatus = refund.status
        console.log("[v0] Refund processed:", refund.id, refundAmount)
      } catch (stripeError: any) {
        console.error("[v0] Stripe refund error:", stripeError)
        // Continue with cancellation even if refund fails
        return NextResponse.json({ error: `Failed to process refund: ${stripeError.message}` }, { status: 500 })
      }
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: refundAmount > 0 ? "refunded" : "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_status: refundStatus,
      })
      .eq("id", bookingId)

    if (updateError) {
      console.error("[v0] Error updating booking:", updateError)
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    console.log("[v0] Booking cancelled successfully:", bookingId)

    return NextResponse.json({
      success: true,
      refundAmount,
      refundStatus,
      message: "Booking cancelled successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error cancelling booking:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
