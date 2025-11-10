"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  TimeSlot as DBTimeSlot,
  Booking as DBBooking,
} from "@/lib/types/time-slots";

export interface TimeSlot {
  slot_id: string;
  id: string;
  time: string;
  available: boolean;
  maxCapacity: number;
  currentBookings: number;
  duration_hours?: number;
}

export interface Booking {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  price: number;
  status?: "pending" | "confirmed" | "cancelled" | "refunded";
  createdAt: string;
  paymentIntentId?: string;
}

interface BookingCalendarProps {
  onSelectSlot?: (date: Date, timeSlot: TimeSlot) => void;
  serviceName?: string;
  price?: number;
}

export function BookingCalendar({
  onSelectSlot,
  serviceName = "Service",
  price = 50,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [dbTimeSlots, setDbTimeSlots] = useState<DBTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("time_slots")
          .select("*")
          .eq("is_active", true)
          .order("start_time", { ascending: true });

        if (error) throw error;
        setDbTimeSlots(data || []);
      } catch (error) {
        console.error("[v0] Error fetching time slots:", error);
      }
    };

    fetchTimeSlots();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .in("status", ["confirmed", "pending"]);

        if (error) throw error;
        setBookings(data || []);
        console.log(
          "[v0] Loaded",
          data?.length || 0,
          "confirmed bookings from database"
        );
      } catch (error) {
        console.error("[v0] Error fetching bookings:", error);
        // Fallback to Stripe API
        try {
          const response = await fetch("/api/stripe/payments");
          const data = await response.json();
          if (data.bookings) {
            const confirmedBookings = data.bookings.filter(
              (b: Booking) => b.status === "confirmed" || b.status === "pending"
            );
            setBookings(
              confirmedBookings.map((b: Booking) => ({
                id: b.id,
                booking_date: b.date,
                booking_time: b.time,
                customer_name: b.customerName,
                customer_email: b.customerEmail,
                price: b.price,
                status: b.status || "confirmed",
                payment_intent_id: b.paymentIntentId,
                created_at: b.createdAt,
                updated_at: b.createdAt,
              }))
            );
          }
        } catch (fallbackError) {
          console.error("[v0] Fallback error:", fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    if (!selectedDate || dbTimeSlots.length === 0) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const dayOfWeek = selectedDate.getDay();

    // Filter time slots for this day of week
    const daySlots = dbTimeSlots.filter(
      (slot) => slot.day_of_week === dayOfWeek
    );

    if (daySlots.length === 0) {
      setTimeSlots([]);
      return;
    }

    // Get bookings for this date
    const dayBookings = bookings.filter(
      (b) =>
        b.booking_date === dateStr &&
        (b.status === "confirmed" || b.status === "pending")
    );

    // Generate available time slots
    const slots: TimeSlot[] = [];

    for (const dbSlot of daySlots) {
      // Parse start and end times
      const [startHour, startMin] = dbSlot.start_time.split(":").map(Number);
      const [endHour, endMin] = dbSlot.end_time.split(":").map(Number);

      // Generate slots based on duration
      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin < endMin)
      ) {
        const time = `${currentHour.toString().padStart(2, "0")}:${currentMin
          .toString()
          .padStart(2, "0")}`;
        const slotBookings = dayBookings.filter((b) => b.booking_time === time);

        slots.push({
          slot_id: dbSlot?.id,
          id: `${dateStr}-${time}`,
          time,
          available: slotBookings.length < dbSlot.max_capacity,
          maxCapacity: dbSlot.max_capacity,
          currentBookings: slotBookings.length,
          duration_hours: dbSlot.duration_hours,
        });

        // Add duration to current time
        const durationMinutes = dbSlot.duration_hours * 60;
        currentMin += durationMinutes;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    }

    setTimeSlots(slots);
  }, [selectedDate, bookings, dbTimeSlots]);

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available && selectedDate && onSelectSlot) {
      onSelectSlot(selectedDate, slot);
    }
  };

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
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
          <CardDescription>
            {selectedDate
              ? selectedDate.toLocaleDateString()
              : "Select a date to see available times"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading available slots...
              </span>
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-2">
              {timeSlots.map((slot) => (
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
                    {slot.duration_hours && slot.duration_hours !== 1 && (
                      <span className="text-xs text-muted-foreground">
                        ({slot.duration_hours}h)
                      </span>
                    )}
                  </span>
                  <Badge variant={slot.available ? "default" : "secondary"}>
                    <Users className="mr-1 h-3 w-3" />
                    {slot.currentBookings}/{slot.maxCapacity}
                  </Badge>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              {selectedDate
                ? "No time slots available for this day"
                : "Select a date to view available slots"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
