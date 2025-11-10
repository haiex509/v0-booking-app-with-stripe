import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerService } from "../../server";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    const paymentIntentId = req.nextUrl.searchParams.get("payment_intent_id");

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json(
        { error: "session_id or payment_intent_id is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    if (session?.status === "complete" && session?.payment_status === "paid") {
      const supabase = await getSupabaseServerService();

      console.log(session?.id);

      try {
        const ups = {
          book_status: session?.status,
          confirmed_at:
            session?.payment_status === "paid"
              ? new Date().toISOString()
              : null,
        };
        const { data, error } = await supabase
          .from("bookings")

          .update(ups)

          .eq("stripe_session_id", session?.id)
          .select("*,package:package_id(*)")
          .single();
        console.log(data);
        console.log(error);
        if (data) {
          const { data: booked, error: errorBooked } = await resend.emails.send(
            {
              from: `${process.env.EMAIL_FROM_ADDRESS}`,
              to: [session?.customer_details?.email],
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
                              src="https://fhmfjbiifzdpdcmmrisi.supabase.co/storage/v1/object/public/haitianhubstudio/haitianhubstudio_logo.png"
                              alt="haitianhubstudio_logo"
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
                              Thank you for booking <strong>${data?.package?.name}</strong>. Your session is
                              currently <strong>${data?.book_status}</strong>.
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
                                  <td style={{ fontSize: "14px" }}>${data?.booking_date}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontSize: "14px" }}>
                                  <strong>Time:</strong>
                                  </td>
                                  <td style={{ fontSize: "14px" }}>${data?.booking_time}</td>
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
                                   <strong>Phone:</strong>
                                  </td>
                                  <td style={{ fontSize: "14px" }}>
                                    ${data?.customer_phone}
                                  </td>
                                </tr>
                                 <tr>
                                  <td style={{ fontSize: "14px" }}>
                                     <strong>Book ID:</strong>
                                  </td>
                                  <td
                                    style={{ fontSize: "14px" }}
                                  >${data?.id}</td>
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

                            <p style="font-size:16px;line-height:24px;margin-top:24px;">
                              If you have any questions, please contact our support team at contact@haitianhubstudio.com
                            </p>

                        

                            <p style="font-size:16px;line-height:24px;margin-top:24px;">
                              Best,<br/>The Team
                            </p>

                            <hr style="border:none;border-top:1px solid #eaeaea;margin:30px 0;" />

                            <p style="font-size:12px;color:#8898aa;text-align:center;">
                              © 2025 Haitian Hub Studio, All rights reserved.<br/>
                              300 NE 44TH ST, OAKLAND PARK, FLORIDA 33334
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
            }
          );

          console.log("=================================");
          console.log(booked);
          console.log("=================================");

          if (errorBooked) {
            console.log(errorBooked);
          }
        }
      } catch (statsErr) {
        console.error("[v0] Error calling update_customer_stats:", statsErr);
      }
    }

    // Return sanitized session data
    return NextResponse.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_details: session.customer_details,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata,
      line_items:
        session.line_items?.data?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          amount_total: item.amount_total,
          price: {
            unit_amount: item.price?.unit_amount,
            currency: item.price?.currency,
          },
        })) || [],
    });

    // const supabase = await getSupabaseServerClient()

    // console.log("[v0] Verifying booking data for:", { sessionId, paymentIntentId })

    // // Check booking
    // let bookingQuery = supabase.from("bookings").select("*")

    // if (sessionId) {
    //   bookingQuery = bookingQuery.eq("stripe_session_id", sessionId)
    // } else if (paymentIntentId) {
    //   bookingQuery = bookingQuery.eq("payment_intent_id", paymentIntentId)
    // }

    // const { data: booking, error: bookingError } = await bookingQuery.maybeSingle()

    // if (bookingError) {
    //   console.error("[v0] Error fetching booking:", bookingError)
    // }

    // // Check payment
    // let paymentQuery = supabase.from("payments").select("*")

    // if (sessionId) {
    //   paymentQuery = paymentQuery.eq("stripe_session_id", sessionId)
    // } else if (paymentIntentId) {
    //   paymentQuery = paymentQuery.eq("stripe_payment_intent_id", paymentIntentId)
    // }

    // const { data: payment, error: paymentError } = await paymentQuery.maybeSingle()

    // if (paymentError) {
    //   console.error("[v0] Error fetching payment:", paymentError)
    // }

    // // Check customer
    // let customer = null
    // if (booking?.customer_id) {
    //   const { data: customerData } = await supabase
    //     .from("customers")
    //     .select("*")
    //     .eq("id", booking.customer_id)
    //     .maybeSingle()

    //   customer = customerData
    // }

    // const result = {
    //   booking: booking || null,
    //   payment: payment || null,
    //   customer: customer || null,
    //   synced: !!(booking && payment && customer),
    // }

    // console.log("[v0] Verification result:", {
    //   hasBooking: !!booking,
    //   hasPayment: !!payment,
    //   hasCustomer: !!customer,
    //   synced: result.synced,
    // })

    // return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error verifying booking:", error);
    return NextResponse.json(
      { error: "Error verifying booking" },
      { status: 500 }
    );
  }
}
