"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsView } from "@/components/admin/payments-view"
import { ClientsView } from "@/components/admin/clients-view"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("payments")

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-400 mt-2">Manage bookings, payments, and clients</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="payments" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Payments
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <PaymentsView />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
