import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { bookingData } = await req.json();

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = req.headers.get("x-forwarded-proto");

    let baseUrl = origin;

    if (!baseUrl && referer) {
      try {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        console.error("[v0] Failed to parse referer:", e);
      }
    }

    if (!baseUrl && (forwardedHost || host)) {
      const finalHost = forwardedHost || host;
      const protocol =
        forwardedProto || (finalHost?.includes("localhost") ? "http" : "https");
      baseUrl = `${protocol}://${finalHost}`;
    }

    if (!baseUrl || baseUrl === "https://null" || baseUrl === "http://null") {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      console.warn("[v0] Using fallback baseUrl:", baseUrl);
    }

    console.log("[v0] Creating checkout session with baseUrl:", baseUrl);

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
            unit_amount: parseInt((bookingData.price * 100).toString()),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancel`,
      customer_email: bookingData.customerEmail,
      metadata: {
        bookingData: JSON.stringify(bookingData),
      },
    });

    try {
      const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          status: "pending",
        }),
      });

      if (!bookingResponse.ok) {
        const errorText = await bookingResponse.text();
        console.error("[v0] Failed to create booking in database:", errorText);
      } else {
        const result = await bookingResponse.json();
        console.log("[v0] Booking created successfully:", result.booking?.id);
      }
    } catch (dbError) {
      console.error("[v0] Error creating booking:", dbError);
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      payment_status: session.payment_status, // "paid", "unpaid", etc.
      payment_intent: session.payment_intent,
      customerEmail: session.customer_details?.email,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error("[v0] Error retrieving checkout session:", error);
    return NextResponse.json(
      { error: "Error retrieving checkout session" },
      { status: 500 }
    );
  }
}
