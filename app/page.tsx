"use client"

import { useRouter } from "next/navigation"
import { BookingCalendar, type TimeSlot } from "@/components/booking-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CreditCard, CheckCircle } from "lucide-react"

export default function Home() {
  const router = useRouter()

  const handleSlotSelect = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = date.toISOString().split("T")[0]
    const params = new URLSearchParams({
      date: dateStr,
      time: timeSlot.time,
      service: "Professional Service",
      price: "50",
    })

    router.push(`/booking/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Book Your Appointment</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your preferred date and time slot. Payment is processed securely through Stripe.
          </p>
        </div>

        {/* How it works */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">1. Choose Date & Time</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Select your preferred date and available time slot from the calendar</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">2. Enter Details & Pay</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Provide your contact information and complete secure payment</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">3. Get Confirmation</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Receive instant confirmation and booking details via email</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Service Info */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Professional Service</CardTitle>
                <CardDescription>60-minute session with our expert team</CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                $50
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Booking Calendar */}
        <div className="max-w-6xl mx-auto">
          <BookingCalendar onSelectSlot={handleSlotSelect} serviceName="Professional Service" price={50} />
        </div>
      </div>
    </div>
  )
}
