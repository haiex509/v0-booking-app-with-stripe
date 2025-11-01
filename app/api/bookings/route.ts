import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json()
    const supabase = await getSupabaseServerClient()

    let customerId: string | null = null

    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", bookingData.customerEmail)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
        console.log("[v0] Found existing customer:", customerId)
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              name: bookingData.customerName,
              email: bookingData.customerEmail,
              phone: bookingData.customerPhone,
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
    } catch (customerErr) {
      console.error("[v0] Error handling customer:", customerErr)
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          customer_name: bookingData.customerName,
          customer_email: bookingData.customerEmail,
          customer_phone: bookingData.customerPhone,
          customer_id: customerId,
          package_id: bookingData.packageId,
          price: bookingData.price,
          status: "pending",
          payment_intent_id: bookingData.paymentIntentId,
          stripe_session_id: bookingData.sessionId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating booking:", error)
      throw error
    }

    console.log("[v0] Booking created successfully:", data.id)
    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/bookings:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { paymentIntentId, status } = await req.json()
    const supabase = await getSupabaseServerClient()

    console.log("[v0] Updating booking with payment_intent_id:", paymentIntentId, "to status:", status)

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      })
      .eq("payment_intent_id", paymentIntentId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating booking:", error)
      throw error
    }

    if (status === "confirmed" && data.customer_id) {
      try {
        const { error: statsError } = await supabase.rpc("update_customer_stats", {
          p_customer_id: data.customer_id,
        })

        if (statsError) {
          console.error("[v0] Error updating customer stats:", statsError)
        } else {
          console.log("[v0] Customer stats updated for:", data.customer_id)
        }
      } catch (statsErr) {
        console.error("[v0] Error calling update_customer_stats:", statsErr)
      }
    }

    console.log("[v0] Booking updated successfully:", data.id)
    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/bookings:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
