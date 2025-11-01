"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CancelBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: {
    id: string
    customer_name: string
    booking_date: string
    start_time: string
    amount: number
    package_name: string
  }
  onSuccess: () => void
}

export function CancelBookingDialog({ open, onOpenChange, booking, onSuccess }: CancelBookingDialogProps) {
  const [refundType, setRefundType] = useState<"full" | "partial" | "none">("full")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Please provide a cancellation reason")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          refundType,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking")
      }

      console.log("[v0] Booking cancelled successfully:", data)
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      console.error("[v0] Error cancelling booking:", err)
      setError(err.message || "Failed to cancel booking")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setRefundType("full")
    setReason("")
    setError("")
  }

  const isPastBooking = new Date(booking.booking_date) < new Date()

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Cancel booking for {booking.customer_name} on {new Date(booking.booking_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPastBooking && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This booking date has passed. You can still cancel and process refunds as needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Refund Option</Label>
            <RadioGroup value={refundType} onValueChange={(value: any) => setRefundType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  Full Refund (${booking.amount.toFixed(2)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal cursor-pointer">
                  Partial Refund (50% - ${(booking.amount * 0.5).toFixed(2)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="font-normal cursor-pointer">
                  No Refund (Cancel only)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for cancellation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || !reason.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
