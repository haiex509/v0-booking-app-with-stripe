"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookingCalendar, type TimeSlot } from "@/components/booking-calendar"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageData: {
    id: string
    name: string
    price: number
  }
}

type Step = "datetime" | "details" | "payment"

export function BookingDialog({ open, onOpenChange, packageData }: BookingDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("datetime")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const handleSlotSelect = (date: Date, timeSlot: TimeSlot) => {
    setSelectedDate(date)
    setSelectedTime(timeSlot)
    setStep("details")
  }

  const handleBack = () => {
    if (step === "details") setStep("datetime")
    else if (step === "payment") setStep("details")
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("payment")
  }

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime) return

    setIsProcessing(true)

    try {
      const dateStr = selectedDate.toISOString().split("T")[0]

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingData: {
            serviceName: packageData.name,
            price: packageData.price,
            date: dateStr,
            time: selectedTime.time,
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
          },
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Failed to process payment. Please try again.")
      setIsProcessing(false)
    }
  }

  const resetDialog = () => {
    setStep("datetime")
    setSelectedDate(null)
    setSelectedTime(null)
    setFormData({ name: "", email: "", phone: "" })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetDialog()
      }}
    >
      <DialogContent className="lg:min-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "datetime" && "Select Your Date & Time"}
            {step === "details" && "Complete Your Booking"}
            {step === "payment" && "Confirm & Pay"}
          </DialogTitle>
          <DialogDescription>
            {step === "datetime" && `Choose an available slot for your ${packageData.name} package`}
            {step === "details" && "Enter your contact information"}
            {step === "payment" && "Review your booking and proceed to payment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Date & Time Selection */}
          {step === "datetime" && (
            <BookingCalendar onSelectSlot={handleSlotSelect} serviceName={packageData.name} price={packageData.price} />
          )}

          {/* Step 2: Booking Details Form */}
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Selected Time</p>
                <p className="text-lg">
                  {selectedDate?.toLocaleDateString()} at {selectedTime?.time}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Payment Confirmation */}
          {step === "payment" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Package</span>
                    <span>{packageData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date & Time</span>
                    <span>
                      {selectedDate?.toLocaleDateString()} at {selectedTime?.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Name</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone</span>
                    <span>{formData.phone}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${packageData.price}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
