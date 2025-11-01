"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { bookingStorage } from "@/lib/booking-storage"
import type { Booking } from "@/components/booking-calendar"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      router.push("/")
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe/checkout?session_id=${sessionId}`)
        const data = await response.json()

        if (data.status === "paid") {
          const bookingData = JSON.parse(data.metadata.bookingData)

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
              const { booking } = await updateResponse.json()
              setBooking({
                id: booking.id,
                date: booking.booking_date,
                time: booking.booking_time,
                customerName: booking.customer_name,
                customerEmail: booking.customer_email,
                serviceName: bookingData.serviceName,
                price: booking.price,
                status: "confirmed",
                createdAt: booking.created_at,
              })
            }
          } catch (dbError) {
            console.error("[v0] Error updating booking:", dbError)
            // Fallback to localStorage
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
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>We couldn't verify your payment. Please contact support.</CardDescription>
          </CardHeader>
          <CardContent>
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
