import * as React from "react";

export const BookingConfirmationEmail = ({
  serviceName,
  price,
  date,
  time,
  customerName,
  customerEmail,
  customerPhone,
  sessionId,
  status,
}) => (
  <html lang="en">
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Booking Confirmation</title>
    </head>
    <body
      style={{
        backgroundColor: "#ffffff",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
      }}
    >
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        align="center"
      >
        <tbody>
          <tr>
            <td>
              <table
                align="center"
                width="100%"
                style={{
                  maxWidth: "600px",
                  margin: "auto",
                  padding: "40px 20px",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center" }}>
                      <img
                        src="https://react-email-demo-rkbbz67tn-resend.vercel.app/static/koala-logo.png"
                        alt="Company Logo"
                        width="160"
                        style={{
                          display: "block",
                          margin: "auto",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "24px", textAlign: "left" }}>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          margin: "0 0 12px",
                        }}
                      >
                        Hi {`${customerName}`},
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          margin: "0 0 16px",
                        }}
                      >
                        Thank you for booking{" "}
                        <strong>{`${serviceName}`}</strong>. Your session is
                        currently <strong>{`${status}`}</strong>.
                      </p>

                      <table
                        width="100%"
                        cellPadding="6"
                        cellSpacing="0"
                        style={{
                          border: "1px solid #eaeaea",
                          borderRadius: "6px",
                          marginTop: "20px",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              📅 <strong>Date:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>{`${date}`}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              🕒 <strong>Time:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>{`${time}`}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              💰 <strong>Price:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>${`${price}`}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              📧 <strong>Email:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>
                              {`${customerEmail}`}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              📞 <strong>Phone:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>
                              {`${customerPhone}`}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              🆔 <strong>Session ID:</strong>
                            </td>
                            <td
                              style={{ fontSize: "14px" }}
                            >{`${sessionId}`}</td>
                          </tr>
                        </tbody>
                      </table>

                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          marginTop: "24px",
                        }}
                      >
                        Once your payment is confirmed, we’ll send you a
                        follow-up email with the session details.
                      </p>

                      <div
                        style={{
                          textAlign: "center",
                          marginTop: "30px",
                        }}
                      >
                        <a
                          href={`https://yourdomain.com/session/${sessionId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            backgroundColor: "#5f51e8",
                            color: "#ffffff",
                            padding: "12px 24px",
                            borderRadius: "4px",
                            textDecoration: "none",
                            fontSize: "16px",
                          }}
                        >
                          View Booking
                        </a>
                      </div>

                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          marginTop: "24px",
                        }}
                      >
                        Best,
                        <br />
                        The Team
                      </p>

                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px solid #eaeaea",
                          margin: "30px 0",
                        }}
                      />

                      <p
                        style={{
                          fontSize: "12px",
                          color: "#8898aa",
                          textAlign: "center",
                        }}
                      >
                        © 2025 Your Company, All rights reserved.
                        <br />
                        470 Noor Ave STE B #1148, South San Francisco, CA 94080
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
);
