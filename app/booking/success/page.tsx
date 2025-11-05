"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BookingDisplay = {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  customerEmail: string;
  customerName: string;
};

type VerificationStatus = {
  booking: boolean;
  payment: boolean;
  customer: boolean;
  synced: boolean;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      console.error("[v0] No session_id in URL");
      router.push("/");
      return;
    }

    const verifyPaymentAndData = async () => {
      try {
        console.log("[v0] ===== VERIFYING PAYMENT AND DATA =====");
        console.log("[v0] Session ID:", sessionId);
        console.log("[v0] Retry attempt:", retryCount);

        // Step 1: Verify payment with Stripe
        const paymentResponse = await fetch(
          `/api/stripe/checkout?session_id=${sessionId}`
        );

        if (!paymentResponse.ok) {
          throw new Error(
            `Failed to verify payment: ${paymentResponse.statusText}`
          );
        }

        const paymentData = await paymentResponse.json();
        console.log("[v0] Payment status:", paymentData.payment_status);

        if (paymentData.payment_status !== "paid") {
          console.error(
            "[v0] Payment not completed. Status:",
            paymentData.payment_status
          );
          setError(
            `Payment status: ${paymentData.payment_status}. Please contact support if you were charged.`
          );
          setLoading(false);
          return;
        }

        // Step 2: Verify data was saved to database
        console.log("[v0] Payment confirmed, verifying database sync...");

        const verifyResponse = await fetch(
          `/api/bookings/verify?session_id=${sessionId}`
        );

        if (!verifyResponse.ok) {
          throw new Error(
            `Failed to verify booking data: ${verifyResponse.statusText}`
          );
        }

        const verifyData = await verifyResponse.json();
        console.log("[v0] Database verification result:", verifyData);

        setVerificationStatus({
          booking: !!verifyData.booking,
          payment: !!verifyData.payment,
          customer: !!verifyData.customer,
          synced: verifyData.synced,
        });

        // // If data is not synced yet and we haven't retried too many times, retry
        // if (!verifyData.synced && retryCount < 5) {
        //   console.log("[v0] Data not synced yet, retrying in 2 seconds...");
        //   setTimeout(() => {
        //     setRetryCount(retryCount + 1);
        //   }, 2000);
        //   return;
        // }

        // // If still not synced after retries, show warning but display booking info
        // if (!verifyData.synced) {
        //   console.warn("[v0] Data sync incomplete after retries");
        //   setError(
        //     "Your payment was successful, but we're still processing your booking. You'll receive a confirmation email shortly."
        //   );
        // }

        // Display booking information
        const bookingData = JSON.parse(
          paymentData.metadata?.bookingData || "{}"
        );

        // Step 1: Verify payment with Stripe
        const bookingResponse = await fetch(`/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: verifyData.booking?.id || sessionId,
            serviceName: bookingData.serviceName || "Production Service",
            date: verifyData.booking?.booking_date || bookingData.date,
            time: verifyData.booking?.booking_time || bookingData.time,
            price: verifyData.booking?.price || bookingData.price,
            customerEmail:
              verifyData.customer?.email ||
              paymentData.customerEmail ||
              bookingData.customerEmail,
            customerName: verifyData.customer?.name || bookingData.customerName,
          }),
        });

        setBooking({
          id: verifyData.booking?.id || sessionId,
          serviceName: bookingData.serviceName || "Production Service",
          date: verifyData.booking?.booking_date || bookingData.date,
          time: verifyData.booking?.booking_time || bookingData.time,
          price: verifyData.booking?.price || bookingData.price,
          customerEmail:
            verifyData.customer?.email ||
            paymentData.customerEmail ||
            bookingData.customerEmail,
          customerName: verifyData.customer?.name || bookingData.customerName,
        });

        console.log("[v0] ===== VERIFICATION COMPLETE =====");
        setLoading(false);
      } catch (error) {
        console.error("[v0] Error verifying payment:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
        setLoading(false);
      }
    };

    verifyPaymentAndData();
  }, [searchParams, router, retryCount]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            {retryCount > 0
              ? `Verifying booking data... (${retryCount}/5)`
              : "Verifying your payment..."}
          </p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">What to do next:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your email for a payment confirmation from Stripe</li>
                <li>Contact support with your session ID</li>
                <li>Do not attempt to pay again until confirmed</li>
              </ul>
            </div>
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=" flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Booking Confirmed!</CardTitle>
          <CardDescription>
            Your payment was successful and your booking has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {verificationStatus && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4" />
                <span>Database Status</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Booking Record</span>
                  <span
                    className={
                      verificationStatus.booking
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {verificationStatus.booking ? "✓ Saved" : "⏳ Processing"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Record</span>
                  <span
                    className={
                      verificationStatus.payment
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {verificationStatus.payment ? "✓ Saved" : "⏳ Processing"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer Record</span>
                  <span
                    className={
                      verificationStatus.customer
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {verificationStatus.customer ? "✓ Saved" : "⏳ Processing"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium">
                {booking?.serviceName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">
                {booking?.date
                  ? new Date(booking.date).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium">{booking?.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-sm font-medium">${booking?.price}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            A confirmation email has been sent to {booking?.customerEmail}
          </p>

          <Button onClick={() => router.push("/")} className="w-full">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
