"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function CancelPage() {
  const router = useRouter()

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Booking Cancelled</CardTitle>
          <CardDescription>Your payment was cancelled and no charges were made.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You can try booking again or contact us if you need assistance.
          </p>

          <div className="flex gap-2">
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
              Return Home
            </Button>
            <Button onClick={() => router.back()} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
