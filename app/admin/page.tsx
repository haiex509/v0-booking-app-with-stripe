"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsView } from "@/components/admin/payments-view"
import { ClientsView } from "@/components/admin/clients-view"
import { SettingsView } from "@/components/admin/settings-view"
import { PackagesView } from "@/components/admin/packages-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"
import { initializeAdminCode, verifyAdminCode } from "@/lib/admin-auth"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("payments")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    initializeAdminCode()
    const authStatus = sessionStorage.getItem("admin_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (verifyAdminCode(code)) {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin_authenticated", "true")
      setError("")
    } else {
      setError("Invalid access code")
      setCode("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("admin_authenticated")
    setCode("")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-2xl text-white">Admin Access</CardTitle>
            <CardDescription className="text-zinc-400">Enter your access code to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-white">
                  Access Code
                </Label>
                <Input
                  id="code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter admin code"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-semibold">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
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
            <TabsTrigger value="packages" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Packages
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <PaymentsView />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsView />
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <PackagesView />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
