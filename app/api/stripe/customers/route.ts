import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function GET(req: NextRequest) {
  try {
    // Fetch all payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ["data.charges"],
    })

    // Fetch all checkout sessions to get metadata
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    })

    // Create a map of payment intent ID to session metadata
    const sessionMap = new Map()
    for (const session of sessions.data) {
      if (session.payment_intent) {
        sessionMap.set(session.payment_intent, session)
      }
    }

    // Group by customer email
    const clientMap = new Map()

    paymentIntents.data.forEach((pi) => {
      const session = sessionMap.get(pi.id)
      let bookingData: any = {}

      if (session?.metadata?.bookingData) {
        try {
          bookingData = JSON.parse(session.metadata.bookingData)
        } catch (e) {
          console.error("Error parsing booking data:", e)
        }
      }

      const email =
        bookingData.customerEmail || pi.charges.data[0]?.billing_details?.email || session?.customer_details?.email

      if (!email || email === "N/A") return

      if (!clientMap.has(email)) {
        clientMap.set(email, {
          email,
          name: bookingData.customerName || pi.charges.data[0]?.billing_details?.name || "Unknown",
          bookings: [],
          totalSpent: 0,
          lastBooking: new Date(pi.created * 1000).toISOString().split("T")[0],
        })
      }

      const client = clientMap.get(email)

      // Determine status
      let status = "confirmed"
      if (pi.status === "canceled") {
        status = "cancelled"
      } else if (pi.charges.data[0]?.refunded) {
        status = "refunded"
      }

      const booking = {
        id: pi.id,
        paymentIntentId: pi.id,
        date: bookingData.date || new Date(pi.created * 1000).toISOString().split("T")[0],
        time: bookingData.time || "N/A",
        serviceName: bookingData.serviceName || pi.description || "Booking Service",
        price: pi.amount / 100,
        status,
        createdAt: new Date(pi.created * 1000).toISOString(),
      }

      client.bookings.push(booking)

      // Only count non-refunded bookings
      if (status !== "refunded") {
        client.totalSpent += booking.price
      }

      // Update last booking date
      if (new Date(booking.date) > new Date(client.lastBooking)) {
        client.lastBooking = booking.date
      }
    })

    // Convert to array and sort by total spent
    const clients = Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching customers from Stripe:", error)
    return NextResponse.json({ error: "Error fetching customers" }, { status: 500 })
  }
}
