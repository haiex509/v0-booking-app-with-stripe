import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id")
    const paymentIntentId = req.nextUrl.searchParams.get("payment_intent_id")

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json({ error: "session_id or payment_intent_id is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    console.log("[v0] Verifying booking data for:", { sessionId, paymentIntentId })

    // Check booking
    let bookingQuery = supabase.from("bookings").select("*")

    if (sessionId) {
      bookingQuery = bookingQuery.eq("stripe_session_id", sessionId)
    } else if (paymentIntentId) {
      bookingQuery = bookingQuery.eq("payment_intent_id", paymentIntentId)
    }

    const { data: booking, error: bookingError } = await bookingQuery.maybeSingle()

    if (bookingError) {
      console.error("[v0] Error fetching booking:", bookingError)
    }

    // Check payment
    let paymentQuery = supabase.from("payments").select("*")

    if (sessionId) {
      paymentQuery = paymentQuery.eq("stripe_session_id", sessionId)
    } else if (paymentIntentId) {
      paymentQuery = paymentQuery.eq("stripe_payment_intent_id", paymentIntentId)
    }

    const { data: payment, error: paymentError } = await paymentQuery.maybeSingle()

    if (paymentError) {
      console.error("[v0] Error fetching payment:", paymentError)
    }

    // Check customer
    let customer = null
    if (booking?.customer_id) {
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", booking.customer_id)
        .maybeSingle()

      customer = customerData
    }

    const result = {
      booking: booking || null,
      payment: payment || null,
      customer: customer || null,
      synced: !!(booking && payment && customer),
    }

    console.log("[v0] Verification result:", {
      hasBooking: !!booking,
      hasPayment: !!payment,
      hasCustomer: !!customer,
      synced: result.synced,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error verifying booking:", error)
    return NextResponse.json({ error: "Error verifying booking" }, { status: 500 })
  }
}
