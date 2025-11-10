import { type NextRequest, NextResponse } from "next/server";
// import { getSupabaseServerService } from "@/lib/supabase/server"
import { getSupabaseServerService } from "../server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json();
    const supabase = await getSupabaseServerService();

    let customerId: string | null = null;

    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", bookingData.customerEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log("[v0] Found existing customer:", customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              name: bookingData.customerName,
              email: bookingData.customerEmail,
              phone: bookingData.customerPhone,
            },
          ])
          .select()
          .single();

        if (customerError) {
          console.error("[v0] Error creating customer:", customerError);
        } else {
          customerId = newCustomer.id;
          console.log("[v0] Created new customer:", customerId);
        }
      }
    } catch (customerErr) {
      console.error("[v0] Error handling customer:", customerErr);
    }
    if (bookingData?.sessionId) {
      const { data: existingBook } = await supabase
        .from("bookings")
        .select("id")
        .eq("stripe_session_id", bookingData?.sessionId)
        .single();

      if (existingBook === null) {
        const { data, error } = await supabase
          .from("bookings")
          .insert([
            {
              package_id: bookingData.package_id,
              time_slot_id: bookingData.slot_id,
              booking_date: bookingData.date,
              booking_time: bookingData.time,
              customer_name: bookingData.customerName,
              customer_email: bookingData.customerEmail,
              customer_phone: bookingData.customerPhone,
              customer_id: customerId,
              price: bookingData.price,
              amount: bookingData.price,
              status: "pending",
              book_status: "pending",
              payment_intent_id: bookingData.paymentIntentId,
              stripe_session_id: bookingData.sessionId,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("[v0] Error creating booking:", error);
          throw error;
        }

        console.log("[v0] Booking created successfully:", data.id);
        return NextResponse.json({ success: true, booking: data });
      } else {
        return NextResponse.json({ success: false, booking: {} });
      }
    } else {
      return NextResponse.json({ success: false, booking: {} });
    }
  } catch (error) {
    console.error("[v0] Error in POST /api/bookings:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { paymentIntentId, status } = await req.json();
    const supabase = await getSupabaseServerService();

    console.log(
      "[v0] Updating booking with payment_intent_id:",
      paymentIntentId,
      "to status:",
      status
    );

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      })
      .eq("payment_intent_id", paymentIntentId)
      .select()
      .single();

    if (error) {
      console.error("[v0] Error updating booking:", error);
      throw error;
    }

    if (status === "confirmed" && data.customer_id) {
      try {
        const { error: statsError } = await supabase.rpc(
          "update_customer_stats",
          {
            p_customer_id: data.customer_id,
          }
        );

        const { data: booked, error: errorBooked } = await resend.emails.send({
          from: `${process.env.EMAIL_FROM_ADDRESS}`,
          to: [data.customer_email],
          subject: "Hub Booked",
          html: `<html lang="en">
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
                        Hi ${data?.customer_name},
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          margin: "0 0 16px",
                        }}
                      >
                        Thank you for booking <strong>${data?.service_name}</strong>. Your session is
                        currently <strong>${data?.status}</strong>.
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
                            <strong>Date:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>${data?.date}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                            <strong>Time:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>${data?.time}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                             <strong>Price:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>$${data?.price}</td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                             <strong>Email:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>
                              ${data?.customer_email}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                              📞 <strong>Phone:</strong>
                            </td>
                            <td style={{ fontSize: "14px" }}>
                              ${data?.customer_phone}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: "14px" }}>
                               <strong>Session ID:</strong>
                            </td>
                            <td
                              style={{ fontSize: "14px" }}
                            >${data?.stripe_session_id}</td>
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
                          href={"https://yourdomain.com/session/${data?.stripe_session_id}"}
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
  </html>`,
          // react: EmailTemplate({ firstName: 'John' }),
        });

        console.log("=================================");
        console.log(booked);
        console.log("=================================");

        if (errorBooked) {
          console.log(errorBooked);
        }

        if (statsError) {
          console.error("[v0] Error updating customer stats:", statsError);
        } else {
          console.log("[v0] Customer stats updated for:", data.customer_id);
        }
      } catch (statsErr) {
        console.error("[v0] Error calling update_customer_stats:", statsErr);
      }
    }

    console.log("[v0] Booking updated successfully:", data.id);
    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error("[v0] Error in PATCH /api/bookings:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
