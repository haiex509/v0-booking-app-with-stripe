"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsView } from "@/components/admin/payments-view"
import { ClientsView } from "@/components/admin/clients-view"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState("payments")
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">Manage bookings, payments, and clients</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 bg-transparent"
          >
            Logout
          </Button>
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
