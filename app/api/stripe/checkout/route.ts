import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: NextRequest) {
  try {
    const { bookingData } = await req.json()

    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/")
    const baseUrl = origin || `https://${req.headers.get("host")}`

    console.log("[v0] Creating checkout session with baseUrl:", baseUrl)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bookingData.serviceName || "Booking Service",
              description: `Booking for ${bookingData.date} at ${bookingData.time}`,
            },
            unit_amount: bookingData.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancel`,
      metadata: {
        bookingData: JSON.stringify(bookingData),
      },
    })

    try {
      const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
        }),
      })

      if (!bookingResponse.ok) {
        console.error("[v0] Failed to create booking in database")
      }
    } catch (dbError) {
      console.error("[v0] Error creating booking:", dbError)
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error("Error retrieving checkout session:", error)
    return NextResponse.json({ error: "Error retrieving checkout session" }, { status: 500 })
  }
}
