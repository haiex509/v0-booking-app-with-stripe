import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 })
    }

    // Create a refund for the payment intent
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    })

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      },
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
