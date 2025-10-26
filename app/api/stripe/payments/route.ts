import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function GET(req: NextRequest) {
  try {
    console.log("[v0] Fetching payment intents from Stripe...")

    // Fetch all payment intents (limit to last 100)
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ["data.charges"],
    })

    if (!paymentIntents || !paymentIntents.data) {
      console.error("[v0] Invalid payment intents response:", paymentIntents)
      return NextResponse.json({ bookings: [] })
    }

    console.log("[v0] Found", paymentIntents.data.length, "payment intents")

    // Fetch all checkout sessions to get metadata
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    })

    if (!sessions || !sessions.data) {
      console.error("[v0] Invalid sessions response:", sessions)
      return NextResponse.json({ bookings: [] })
    }

    console.log("[v0] Found", sessions.data.length, "checkout sessions")

    // Create a map of payment intent ID to session metadata
    const sessionMap = new Map()
    for (const session of sessions.data) {
      if (session.payment_intent) {
        sessionMap.set(session.payment_intent, session)
      }
    }

    // Transform payment intents into booking format
    const bookings = paymentIntents.data.map((pi) => {
      const session = sessionMap.get(pi.id)
      let bookingData: any = {}

      // Parse booking data from session metadata
      if (session?.metadata?.bookingData) {
        try {
          bookingData = JSON.parse(session.metadata.bookingData)
        } catch (e) {
          console.error("Error parsing booking data:", e)
        }
      }

      // Determine status based on payment intent and refund status
      let status = "confirmed"
      if (pi.status === "canceled") {
        status = "cancelled"
      } else if (pi.charges?.data?.[0]?.refunded) {
        status = "refunded"
      }

      return {
        id: pi.id,
        paymentIntentId: pi.id,
        date: bookingData.date || new Date(pi.created * 1000).toISOString().split("T")[0],
        time: bookingData.time || "N/A",
        customerName: bookingData.customerName || pi.charges?.data?.[0]?.billing_details?.name || "Unknown",
        customerEmail:
          bookingData.customerEmail ||
          pi.charges?.data?.[0]?.billing_details?.email ||
          session?.customer_details?.email ||
          "N/A",
        serviceName: bookingData.serviceName || pi.description || "Booking Service",
        price: pi.amount / 100, // Convert from cents
        status,
        createdAt: new Date(pi.created * 1000).toISOString(),
      }
    })

    // Sort by creation date, most recent first
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log("[v0] Returning", bookings.length, "bookings")
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching payments from Stripe:", error)
    return NextResponse.json({ bookings: [], error: "Error fetching payments" }, { status: 500 })
  }
}
