"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import Link from "next/link"
import { getPackages, type Package } from "@/lib/package-storage"

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPackages = async () => {
      const storedPackages = await getPackages()
      // Only show active packages on the public page
      const activePackages = storedPackages.filter((pkg) => pkg.is_active)
      setPackages(activePackages)
      setLoading(false)
    }
    loadPackages()
  }, [])

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show message if no packages available
  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border">
          <div className="container mx-auto px-5 py-4 flex justify-end">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-foreground/10 bg-transparent"
              >
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <div className="container py-12 px-5 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">No Packages Available</h2>
            <p className="text-muted-foreground">Please check back later or contact the administrator.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background ">
    {/*  <div className="border-b border-border">
        <div className="container mx-auto px-5 py-4 flex justify-end">
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-foreground/10 bg-transparent"
            >
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>*/}

      <div className="container py-12 px-5 space-y-16  mx-auto">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Production Packages9999</h1>
          <p className="text-lg text-muted-foreground">Choose your package and book your session</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative transition-all hover:shadow-xl ${
                pkg.popular ? "border-2 border-primary" : "border border-border"
              }`}
              onClick={() => handleSelectPackage(pkg)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl text-foreground">{pkg.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary">${pkg.price}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={pkg.popular ? "destructive" : "outline"}
                  className={`w-full mt-4 ${
                    pkg.popular
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "border-foreground text-foreground hover:bg-foreground/10"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectPackage(pkg)
                  }}
                >
                  Select
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedPackage && (
        <BookingDialog open={dialogOpen} onOpenChange={setDialogOpen} packageData={selectedPackage} />
      )}
    </div>
  )
}
