"use client"

import { useEffect, useState } from "react"
import type { Booking } from "@/components/booking-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"

interface ClientData {
  email: string
  name: string
  bookings: Booking[]
  totalSpent: number
  lastBooking: string
}

export function ClientsView() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/stripe/customers")
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error("Error loading clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Total Clients</CardDescription>
            <CardTitle className="text-3xl text-white">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Average Spend</CardDescription>
            <CardTitle className="text-3xl text-gold">
              {clients.length > 0
                ? formatCurrency(clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length)
                : "$0"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="text-zinc-400">Repeat Clients</CardDescription>
            <CardTitle className="text-3xl text-white">{clients.filter((c) => c.bookings.length > 1).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">All Clients</CardTitle>
          <CardDescription className="text-zinc-400">
            View client information and booking history from Stripe
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">{searchQuery ? "No clients found" : "No clients yet"}</p>
            ) : (
              filteredClients.map((client) => (
                <div key={client.email} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                      <p className="text-sm text-zinc-400">{client.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">{formatCurrency(client.totalSpent)}</p>
                      <p className="text-xs text-zinc-500">Total Spent</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                    <div>
                      <span className="text-zinc-500">Bookings:</span>{" "}
                      <span className="text-white font-medium">{client.bookings.length}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Last Booking:</span>{" "}
                      <span className="text-white">{formatDate(client.lastBooking)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Booking History</p>
                    <div className="space-y-2">
                      {client.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between text-sm p-2 rounded bg-zinc-900/50"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                booking.status === "refunded"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : booking.status === "cancelled"
                                    ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                    : "bg-green-500/10 text-green-500 border-green-500/20"
                              }
                            >
                              {booking.status || "confirmed"}
                            </Badge>
                            <span className="text-zinc-300">{booking.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500">{formatDate(booking.date)}</span>
                            <span className="text-gold font-medium">{formatCurrency(booking.price || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
