"use client"

import { useEffect, useState } from "react"
import { bookingStorage } from "@/lib/booking-storage"
import type { Booking } from "@/components/booking-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function PaymentsView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isRefunding, setIsRefunding] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {
    const allBookings = bookingStorage.getAll()
    // Sort by date, most recent first
    const sorted = allBookings.sort((a, b) => {
      const dateA = new Date(a.date + " " + a.time)
      const dateB = new Date(b.date + " " + b.time)
      return dateB.getTime() - dateA.getTime()
    })
    setBookings(sorted)
  }

  const handleRefundClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowRefundDialog(true)
  }

  const handleRefund = async () => {
    if (!selectedBooking?.paymentIntentId) return

    setIsRefunding(true)
    try {
      const response = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: selectedBooking.paymentIntentId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update booking status to refunded
        bookingStorage.update(selectedBooking.id, { status: "refunded" })
        loadBookings()
        alert("Refund processed successfully!")
      } else {
        alert("Failed to process refund: " + data.error)
      }
    } catch (error) {
      console.error("Refund error:", error)
      alert("Failed to process refund")
    } finally {
      setIsRefunding(false)
      setShowRefundDialog(false)
      setSelectedBooking(null)
    }
  }

  const handleCancel = (booking: Booking) => {
    if (confirm(`Are you sure you want to cancel this booking for ${booking.customerName}?`)) {
      bookingStorage.update(booking.id, { status: "cancelled" })
      loadBookings()
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "cancelled":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
      case "refunded":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-gold/10 text-gold border-gold/20"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Total Bookings</CardDescription>
            <CardTitle className="text-3xl text-white">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Total Revenue</CardDescription>
            <CardTitle className="text-3xl text-gold">
              {formatCurrency(
                bookings.filter((b) => b.status !== "refunded").reduce((sum, b) => sum + (b.price || 0), 0),
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Confirmed</CardDescription>
            <CardTitle className="text-3xl text-white">
              {bookings.filter((b) => b.status === "confirmed").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">All Payments</CardTitle>
          <CardDescription className="text-zinc-400">Manage bookings and process refunds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No bookings found</p>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{booking.customerName}</h3>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {booking.status || "confirmed"}
                      </Badge>
                    </div>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <p>
                        <span className="text-zinc-500">Package:</span> {booking.serviceName}
                      </p>
                      <p>
                        <span className="text-zinc-500">Date:</span> {booking.date} at {booking.time}
                      </p>
                      <p>
                        <span className="text-zinc-500">Email:</span> {booking.customerEmail}
                      </p>
                      {booking.paymentIntentId && (
                        <p className="text-xs font-mono">
                          <span className="text-zinc-500">Payment ID:</span> {booking.paymentIntentId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-gold">{formatCurrency(booking.price || 0)}</p>
                    <div className="flex gap-2">
                      {booking.status !== "cancelled" && booking.status !== "refunded" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            Cancel
                          </Button>
                          {booking.paymentIntentId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefundClick(booking)}
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              Refund
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Process Refund</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to refund {formatCurrency(selectedBooking?.price || 0)} to{" "}
              {selectedBooking?.customerName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRefunding}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isRefunding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Refund"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
