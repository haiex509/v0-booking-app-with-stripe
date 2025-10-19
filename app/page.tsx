"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"

const packages = [
  {
    id: "indie",
    name: "Indie",
    price: 399,
    features: ["1 hr studio rental", "20 cinematic edits", "1 look/1 backdrop", "Online gallery"],
  },
  {
    id: "feature",
    name: "Feature",
    price: 799,
    popular: true,
    features: [
      "3 hr production",
      "60 final stills",
      "2 looks + set changes",
      "Color-graded gallery",
      "MUA & stylist included",
    ],
  },
  {
    id: "blockbuster",
    name: "Blockbuster",
    price: 1499,
    features: ["Full-day shoot", "120+ hero images", "Unlimited sets", "Behind-the-scenes 4K video", "Same-day teaser"],
  },
]

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<(typeof packages)[0] | null>(null)

  const handleSelectPackage = (pkg: (typeof packages)[0]) => {
    setSelectedPackage(pkg)
    setDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background ">
      <div className="container py-12 space-y-16  mx-auto">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Production Packages</h1>
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
