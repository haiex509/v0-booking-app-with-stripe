import type * as React from "react"

interface PaymentFailedEmailProps {
  customerName: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  price: number
  bookingId: string
}

export const PaymentFailedEmail: React.FC<PaymentFailedEmailProps> = ({
  customerName,
  serviceName,
  bookingDate,
  bookingTime,
  price,
  bookingId,
}) => (
  <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ backgroundColor: "#f59e0b", padding: "20px", textAlign: "center" }}>
      <h1 style={{ color: "white", margin: 0 }}>Payment Failed</h1>
    </div>

    <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
      <p style={{ fontSize: "16px", color: "#374151" }}>Hi {customerName},</p>

      <p style={{ fontSize: "16px", color: "#374151" }}>
        We were unable to process your payment for the following booking. Your booking has been cancelled.
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
            <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "14px" }}>Amount:</td>
            <td
              style={{ padding: "10px 0", color: "#1f2937", fontSize: "16px", fontWeight: "bold", textAlign: "right" }}
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

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fee2e2", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#991b1b" }}>
          <strong>What happened?</strong>
          <br />
          Your payment could not be processed. This may be due to insufficient funds, an expired card, or your bank
          declining the transaction.
        </p>
      </div>

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#1e40af" }}>
          <strong>Want to try again?</strong>
          <br />
          You can make a new booking at any time. Please ensure your payment method is valid before trying again.
        </p>
      </div>

      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "20px" }}>
        If you believe this is an error or need assistance, please contact us.
      </p>
    </div>

    <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f3f4f6" }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  </div>
)
