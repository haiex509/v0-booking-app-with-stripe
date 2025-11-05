import type * as React from "react"

interface BookingConfirmationEmailProps {
  customerName: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  bookingId: string
}

export const BookingConfirmationEmail: React.FC<BookingConfirmationEmailProps> = ({
  customerName,
  serviceName,
  bookingDate,
  bookingTime,
  price,
  bookingId,
}) => (
  <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ backgroundColor: "#10b981", padding: "20px", textAlign: "center" }}>
      <h1 style={{ color: "white", margin: 0 }}>Booking Confirmed! ✓</h1>
    </div>

    <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
      <p style={{ fontSize: "16px", color: "#374151" }}>Hi {customerName},</p>

      <p style={{ fontSize: "16px", color: "#374151" }}>
        Great news! Your booking has been confirmed and payment has been processed successfully.
      </p>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginTop: "20px" }}>
        <h2 style={{ color: "#1f2937", fontSize: "18px", marginTop: 0 }}>Booking Details</h2>

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
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Amount Paid:</td>
            <td
              style={{ padding: "10px 0", color: "#10b981", fontSize: "16px", fontWeight: "bold", textAlign: "right" }}
            >
              ${price.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Booking ID:</td>
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "12px", textAlign: "right" }}>{bookingId}</td>
          </tr>
        </table>
      </div>

      <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#1e40af" }}>
          <strong>What's next?</strong>
          <br />
          We'll send you a reminder 24 hours before your appointment. If you need to make any changes, please contact us
          as soon as possible.
        </p>
      </div>

      <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "30px" }}>Thank you for choosing our service!</p>

      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "20px" }}>
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>

    <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f3f4f6" }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  </div>
)
