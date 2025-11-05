import { Resend } from "resend"
import { BookingConfirmationEmail } from "@/components/emails/booking-confirmation"
import { BookingCancellationEmail } from "@/components/emails/booking-cancellation"
import { PaymentFailedEmail } from "@/components/emails/payment-failed"
import { RefundNotificationEmail } from "@/components/emails/refund-notification"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev"
const COMPANY_NAME = process.env.COMPANY_NAME || "Your Company"

export async function sendBookingConfirmation(booking: {
  customerName: string
  customerEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  bookingId: string
}) {
  try {
    console.log("[v0] Sending booking confirmation email to:", booking.customerEmail)

    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: [booking.customerEmail],
      subject: "Booking Confirmed - Your Appointment Details",
      react: BookingConfirmationEmail({
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        price: booking.price,
        bookingId: booking.bookingId,
      }),
    })

    if (error) {
      console.error("[v0] Error sending booking confirmation email:", error)
      return { success: false, error }
    }

    console.log("[v0] ✓ Booking confirmation email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception sending booking confirmation email:", error)
    return { success: false, error }
  }
}

export async function sendCancellationEmail(booking: {
  customerName: string
  customerEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  refundAmount: number
  cancellationReason: string
  bookingId: string
}) {
  try {
    console.log("[v0] Sending cancellation email to:", booking.customerEmail)

    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: [booking.customerEmail],
      subject: "Booking Cancelled - Confirmation",
      react: BookingCancellationEmail({
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        refundAmount: booking.refundAmount,
        cancellationReason: booking.cancellationReason,
        bookingId: booking.bookingId,
      }),
    })

    if (error) {
      console.error("[v0] Error sending cancellation email:", error)
      return { success: false, error }
    }

    console.log("[v0] ✓ Cancellation email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception sending cancellation email:", error)
    return { success: false, error }
  }
}

export async function sendPaymentFailedEmail(booking: {
  customerName: string
  customerEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  bookingId: string
}) {
  try {
    console.log("[v0] Sending payment failed email to:", booking.customerEmail)

    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: [booking.customerEmail],
      subject: "Payment Failed - Action Required",
      react: PaymentFailedEmail({
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        price: booking.price,
        bookingId: booking.bookingId,
      }),
    })

    if (error) {
      console.error("[v0] Error sending payment failed email:", error)
      return { success: false, error }
    }

    console.log("[v0] ✓ Payment failed email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception sending payment failed email:", error)
    return { success: false, error }
  }
}

export async function sendRefundNotification(booking: {
  customerName: string
  customerEmail: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  refundAmount: number
  originalAmount: number
  bookingId: string
}) {
  try {
    console.log("[v0] Sending refund notification email to:", booking.customerEmail)

    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: [booking.customerEmail],
      subject: "Refund Processed - Confirmation",
      react: RefundNotificationEmail({
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        refundAmount: booking.refundAmount,
        originalAmount: booking.originalAmount,
        bookingId: booking.bookingId,
      }),
    })

    if (error) {
      console.error("[v0] Error sending refund notification email:", error)
      return { success: false, error }
    }

    console.log("[v0] ✓ Refund notification email sent successfully:", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception sending refund notification email:", error)
    return { success: false, error }
  }
}
