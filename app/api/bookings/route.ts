import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json()
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          customer_name: bookingData.customerName,
          customer_email: bookingData.customerEmail,
          customer_phone: bookingData.customerPhone,
          price: bookingData.price,
          status: "pending",
          payment_intent_id: bookingData.paymentIntentId,
          stripe_session_id: bookingData.sessionId,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { paymentIntentId, status } = await req.json()
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("payment_intent_id", paymentIntentId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
