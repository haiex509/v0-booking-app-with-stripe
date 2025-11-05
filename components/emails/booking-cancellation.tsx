import type * as React from "react"

interface BookingCancellationEmailProps {
  customerName: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  refundAmount: number
  cancellationReason: string
  bookingId: string
}

export const BookingCancellationEmail: React.FC<BookingCancellationEmailProps> = ({
  customerName,
  serviceName,
  bookingDate,
  bookingTime,
  refundAmount,
  cancellationReason,
  bookingId,
}) => (
  <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ backgroundColor: "#ef4444", padding: "20px", textAlign: "center" }}>
      <h1 style={{ color: "white", margin: 0 }}>Booking Cancelled</h1>
    </div>

    <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
      <p style={{ fontSize: "16px", color: "#374151" }}>Hi {customerName},</p>

      <p style={{ fontSize: "16px", color: "#374151" }}>Your booking has been cancelled as requested.</p>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginTop: "20px" }}>
        <h2 style={{ color: "#1f2937", fontSize: "18px", marginTop: 0 }}>Cancelled Booking Details</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Service:</td>
            <td
              style={{ padding: "10px 0", color: "#1f2937", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}
            >
              {serviceName}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Date:</td>
            <td
              style={{ padding: "10px 0", color: "#1f2937", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}
            >
              {new Date(bookingDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Time:</td>
            <td
              style={{ padding: "10px 0", color: "#1f2937", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}
            >
              {bookingTime}
            </td>
          </tr>
          {refundAmount > 0 && (
            <tr>
              <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Refund Amount:</td>
              <td
                style={{
                  padding: "10px 0",
                  color: "#10b981",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textAlign: "right",
                }}
              >
                ${refundAmount.toFixed(2)}
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Booking ID:</td>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "12px", textAlign: "right" }}>{bookingId}</td>
          </tr>
        </table>
      </div>

      {refundAmount > 0 && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#dcfce7", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#166534" }}>
            <strong>Refund Processing</strong>
            <br />
            Your refund of ${refundAmount.toFixed(2)} will be processed within 5-10 business days and will appear on
            your original payment method.
          </p>
        </div>
      )}

      {cancellationReason && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#92400e" }}>
            <strong>Cancellation Reason:</strong>
            <br />
            {cancellationReason}
          </p>
        </div>
      )}

      <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "30px" }}>
        We're sorry to see you go. If you'd like to book again in the future, we'd be happy to serve you.
      </p>

      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "20px" }}>
        If you have any questions about this cancellation, please contact us.
      </p>
    </div>

    <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f3f4f6" }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  </div>
)
