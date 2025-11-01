"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Booking as DBBooking } from "@/lib/types/time-slots"

export function PaymentsView() {
  const [bookings, setBookings] = useState<DBBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<DBBooking | null>(null)
  const [isRefunding, setIsRefunding] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error("Error loading bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefundClick = (booking: DBBooking) => {
    setSelectedBooking(booking)
    setRefundReason("")
    setShowRefundDialog(true)
  }

  const handleRefund = async () => {
    if (!selectedBooking?.id) return

    setIsRefunding(true)
    try {
      const response = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentIntentId: selectedBooking.payment_intent_id,
          reason: refundReason || "requested_by_customer",
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadBookings()
        alert(data.message || "Refund processed successfully! The time slot is now available for booking.")
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
      setRefundReason("")
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
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
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

  const totalRevenue = bookings
    .filter((b) => b.status !== "refunded" && b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.price || 0), 0)

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length
  const refundedCount = bookings.filter((b) => b.status === "refunded").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Total Bookings</CardDescription>
            <CardTitle className="text-3xl text-white">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Total Revenue</CardDescription>
            <CardTitle className="text-3xl text-gold">{formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Confirmed</CardDescription>
            <CardTitle className="text-3xl text-white">{confirmedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Refunded</CardDescription>
            <CardTitle className="text-3xl text-blue-400">{refundedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">All Bookings</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage bookings and process refunds (refunds free up time slots automatically)
          </CardDescription>
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
                      <h3 className="font-semibold text-white">{booking.customer_name}</h3>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {booking.status || "confirmed"}
                      </Badge>
                    </div>
                    <div className="text-sm text-zinc-400 space-y-1">
                      <p>
                        <span className="text-zinc-500">Date:</span> {booking.booking_date} at {booking.booking_time}
                      </p>
                      <p>
                        <span className="text-zinc-500">Email:</span> {booking.customer_email}
                      </p>
                      {booking.customer_phone && (
                        <p>
                          <span className="text-zinc-500">Phone:</span> {booking.customer_phone}
                        </p>
                      )}
                      {booking.payment_intent_id && (
                        <p className="text-xs font-mono">
                          <span className="text-zinc-500">Payment ID:</span> {booking.payment_intent_id}
                        </p>
                      )}
                      {booking.refund_reason && (
                        <p className="text-xs">
                          <span className="text-zinc-500">Refund Reason:</span> {booking.refund_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-gold">{formatCurrency(booking.price || 0)}</p>
                    {booking.refund_amount && (
                      <p className="text-sm text-blue-400">Refunded: {formatCurrency(booking.refund_amount)}</p>
                    )}
                    <div className="flex gap-2">
                      {booking.status === "confirmed" && booking.payment_intent_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefundClick(booking)}
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Process Refund</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Refund {formatCurrency(selectedBooking?.price || 0)} to {selectedBooking?.customer_name}
              <br />
              <span className="text-sm text-blue-400 mt-2 block">
                The time slot ({selectedBooking?.booking_date} at {selectedBooking?.booking_time}) will become available
                again after refund.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">
                Refund Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., Customer requested cancellation, Service unavailable, etc."
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={isRefunding}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={isRefunding} className="bg-red-500 text-white hover:bg-red-600">
              {isRefunding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
