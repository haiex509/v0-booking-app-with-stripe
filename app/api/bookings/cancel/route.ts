import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { bookingId, refundType, reason } = await req.json();

    if (!bookingId || !reason) {
      return NextResponse.json(
        { error: "Booking ID and reason are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get the current user (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled" || booking.status === "refunded") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    let refundAmount = 0;
    let refundStatus = "none";

    // Process refund if requested
    if (refundType !== "none" && booking.payment_intent_id) {
      try {
        const refundAmountCents =
          refundType === "full" ? booking.amount * 100 : booking.amount * 50; // 50% for partial

        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: Math.round(refundAmountCents),
          reason: "requested_by_customer",
          metadata: {
            booking_id: bookingId,
            cancelled_by: user.id,
            cancellation_reason: reason,
          },
        });

        refundAmount = refund?.amount / 100;
        refundStatus = refund?.status;
        console.log("[v0] Refund processed:", refund.id, refundAmount);
      } catch (stripeError: any) {
        console.error("[v0] Stripe refund error:", stripeError);
        // Continue with cancellation even if refund fails
        return NextResponse.json(
          { error: `Failed to process refund: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    // Update booking status
    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: refundAmount > 0 ? "refunded" : "cancelled",
        book_status: refundAmount > 0 ? "refunded" : "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_status: refundStatus,
      })
      .eq("id", bookingId)
      .select("*,package:package_id(*)")
      .single();

    if (updateError) {
      console.error("[v0] Error updating booking:", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    const status = refundAmount > 0 ? "refunded" : "cancelled";

    // const bookingUpdate = {
    //   status,
    //   cancelled_at: new Date().toISOString(),
    //   cancelled_by: user.id,
    //   cancellation_reason: reason,
    //   refund_amount: refundAmount,
    //   refund_status: refundStatus,
    // };

    const subject =
      status === "refunded"
        ? "Your Booking Has Been Refunded"
        : "Your Booking Has Been Cancelled";

    const message =
      status === "refunded"
        ? `Your booking for <strong>${data?.package?.name}</strong> has been cancelled and a refund of <strong>$${refundAmount}</strong> has been processed.`
        : `Your booking for <strong>${data?.package?.name}</strong> has been cancelled.`;

    const refundSection =
      status === "refunded"
        ? `
      <tr>
        <td style="font-size:14px;"><strong>Refund Amount:</strong></td>
        <td style="font-size:14px;">$${refundAmount}</td>
      </tr>
      <tr>
        <td style="font-size:14px;"><strong>Refund Status:</strong></td>
        <td style="font-size:14px;">${refundStatus}</td>
      </tr>`
        : "";

    const reasonSection = reason
      ? `
      <tr>
        <td style="font-size:14px;"><strong>Reason:</strong></td>
        <td style="font-size:14px;">${reason}</td>
      </tr>`
      : "";

    const { data: cancelled, error: errorCancelled } = await resend.emails.send(
      {
        from: `${process.env.EMAIL_FROM_ADDRESS}`,
        to: [data?.customer_email],
        subject,
        html: `
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>${subject}</title>
    </head>
    <body style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" align="center">
        <tbody>
          <tr>
            <td>
              <table align="center" width="100%" style="max-width:600px;margin:auto;padding:40px 20px;">
                <tbody>
                  <tr>
                    <td style="text-align:center;">
                      <img
                        src="https://fhmfjbiifzdpdcmmrisi.supabase.co/storage/v1/object/public/haitianhubstudio/haitianhubstudio_logo.png"
                        alt="haitianhubstudio_logo"
                        width="160"
                        style="display:block;margin:auto;border:none;outline:none;"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:24px;text-align:left;">
                      <p style="font-size:16px;line-height:24px;margin:0 0 12px;">Hi ${data?.customer_name},</p>
                      <p style="font-size:16px;line-height:24px;margin:0 0 16px;">${message}</p>

                      <table width="100%" cellpadding="6" cellspacing="0" style="border:1px solid #eaeaea;border-radius:6px;margin-top:20px;">
                        <tbody>
                          <tr>
                            <td style="font-size:14px;"><strong>Date:</strong></td>
                            <td style="font-size:14px;">${data?.booking_date}</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;"><strong>Time:</strong></td>
                            <td style="font-size:14px;">${data?.booking_time}</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;"><strong>Price:</strong></td>
                            <td style="font-size:14px;">$${data?.price}</td>
                          </tr>
                          ${refundSection}
                          ${reasonSection}
                          <tr>
                            <td style="font-size:14px;"><strong>Book ID:</strong></td>
                            <td style="font-size:14px;">${data?.id}</td>
                          </tr>
                          <tr>
                            <td style="font-size:14px;"><strong>Session ID:</strong></td>
                            <td style="font-size:14px;">${data?.stripe_session_id}</td>
                          </tr>
                        </tbody>
                      </table>

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
      }
    );

    // const { data: booked, error: errorBooked } = await resend.emails.send({
    //   from: `${process.env.EMAIL_FROM_ADDRESS}`,
    //   to: [booking?.customer_email],
    //   subject: "Cancel Boocking",
    //   html: JSON.stringify({
    //     status: refundAmount > 0 ? "refunded" : "cancelled",
    //     cancelled_at: new Date().toISOString(),
    //     cancelled_by: user.id,
    //     cancellation_reason: reason,
    //     refund_amount: refundAmount,
    //     refund_status: refundStatus,
    //   }),
    //   // react: EmailTemplate({ firstName: 'John' }),
    // });

    // console.log(booked);

    // if (errorBooked) {
    //   console.log(errorBooked);
    // }

    console.log("[v0] Booking cancelled successfully:", bookingId);

    return NextResponse.json({
      success: true,
      refundAmount,
      refundStatus,
      message: "Booking cancelled successfully",
    });
  } catch (error: any) {
    console.error("[v0] Error cancelling booking:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
