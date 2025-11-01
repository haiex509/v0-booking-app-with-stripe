"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { bookingStorage } from "@/lib/booking-storage"
import type { Booking } from "@/components/booking-calendar"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      console.error("[v0] No session_id in URL")
      router.push("/")
      return
    }

    const verifyPayment = async () => {
      try {
        console.log("[v0] Verifying payment for session:", sessionId)

        const response = await fetch(`/api/stripe/checkout?session_id=${sessionId}`)

        if (!response.ok) {
          throw new Error(`Failed to verify payment: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Payment verification response:", data)

        if (data.status === "paid") {
          const bookingData = JSON.parse(data.metadata.bookingData)
          console.log("[v0] Payment confirmed, updating booking...")

          try {
            const updateResponse = await fetch("/api/bookings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentIntentId: data.payment_intent,
                status: "confirmed",
              }),
            })

            if (updateResponse.ok) {
              const { booking: confirmedBooking } = await updateResponse.json()
              console.log("[v0] Booking confirmed in database:", confirmedBooking.id)

              setBooking({
                id: confirmedBooking.id,
                date: confirmedBooking.booking_date,
                time: confirmedBooking.booking_time,
                customerName: confirmedBooking.customer_name,
                customerEmail: confirmedBooking.customer_email,
                serviceName: bookingData.serviceName,
                price: confirmedBooking.price,
                status: "confirmed",
                createdAt: confirmedBooking.created_at,
              })
            } else {
              const errorText = await updateResponse.text()
              console.error("[v0] Failed to update booking:", errorText)
              throw new Error("Failed to confirm booking in database")
            }
          } catch (dbError) {
            console.error("[v0] Database error, using fallback:", dbError)
            const newBooking: Booking = {
              id: crypto.randomUUID(),
              date: bookingData.date,
              time: bookingData.time,
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              serviceName: bookingData.serviceName,
              price: bookingData.price,
              status: "confirmed",
              createdAt: new Date().toISOString(),
            }
            bookingStorage.save(newBooking)
            setBooking(newBooking)
          }
        } else {
          console.error("[v0] Payment not completed. Status:", data.status)
          setError(`Payment status: ${data.status}. Please contact support if you were charged.`)
        }
      } catch (error) {
        console.error("[v0] Error verifying payment:", error)
        setError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>{error || "We couldn't verify your payment. Please contact support."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">What to do next:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your email for a payment confirmation from Stripe</li>
                <li>Contact support with your session ID</li>
                <li>Do not attempt to pay again until confirmed</li>
              </ul>
            </div>
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Booking Confirmed!</CardTitle>
          <CardDescription>Your payment was successful and your booking has been confirmed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium">{booking.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">{new Date(booking.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium">{booking.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-sm font-medium">${booking.price}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            A confirmation email has been sent to {booking.customerEmail}
          </p>

          <Button onClick={() => router.push("/")} className="w-full">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
