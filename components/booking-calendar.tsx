"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"

export interface TimeSlot {
  id: string
  time: string
  available: boolean
  maxCapacity: number
  currentBookings: number
}

export interface Booking {
  id: string
  date: string
  time: string
  customerName: string
  customerEmail: string
  serviceName: string
  price: number
  status?: "pending" | "confirmed" | "cancelled" | "refunded" // Added optional status with refunded option
  createdAt: string
  paymentIntentId?: string // Added optional payment intent ID for refunds
}

interface BookingCalendarProps {
  onSelectSlot?: (date: Date, timeSlot: TimeSlot) => void
  serviceName?: string
  price?: number
}

export function BookingCalendar({ onSelectSlot, serviceName = "Service", price = 50 }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  // Load bookings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("bookings")
    if (stored) {
      setBookings(JSON.parse(stored))
    }
  }, [])

  // Generate time slots for selected date
  useEffect(() => {
    if (!selectedDate) return

    const dateStr = selectedDate.toISOString().split("T")[0]
    const dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== "cancelled")

    // Generate slots from 9 AM to 5 PM
    const slots: TimeSlot[] = []
    for (let hour = 9; hour < 17; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`
      const slotBookings = dayBookings.filter((b) => b.time === time)

      slots.push({
        id: `${dateStr}-${time}`,
        time,
        available: slotBookings.length < 3, // Max 3 bookings per slot
        maxCapacity: 3,
        currentBookings: slotBookings.length,
      })
    }

    setTimeSlots(slots)
  }, [selectedDate, bookings])

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available && selectedDate && onSelectSlot) {
      onSelectSlot(selectedDate, slot)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose a date for your booking</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
          <CardDescription>
            {selectedDate ? selectedDate.toLocaleDateString() : "Select a date to see available times"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-2">
            {timeSlots.length > 0 ? (
              timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={slot.available ? "outline" : "secondary"}
                  disabled={!slot.available}
                  onClick={() => handleSlotSelect(slot)}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {slot.time}
                  </span>
                  <Badge variant={slot.available ? "default" : "secondary"}>
                    <Users className="mr-1 h-3 w-3" />
                    {slot.currentBookings}/{slot.maxCapacity}
                  </Badge>
                </Button>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">Select a date to view available slots</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
