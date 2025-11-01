"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsView } from "@/components/admin/payments-view"
import { ClientsView } from "@/components/admin/clients-view"
import { PackagesView } from "@/components/admin/packages-view"
import { UsersView } from "@/components/admin/users-view"
import { SetupBanner } from "@/components/admin/setup-banner"
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Loader2, Key, LogOut } from "lucide-react"
import { TimeSlotsView } from "@/components/admin/time-slots-view"
import { BookingsView } from "@/components/admin/bookings-view"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("payments")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { role, loading: permissionsLoading, can } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/admin/login")
  }

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const canManageUsers = can("manage_users")

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">Manage bookings, payments, and packages</p>
            <div className="mt-2">
              <span className="text-zinc-400 text-sm">{user.email}</span>
              {role && (
                <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                  {role.replace("_", " ").toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowPasswordDialog(true)}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 bg-transparent"
            >
              <Key className="h-4 w-4 mr-2" />
              <span className="hidden lg:block">Change Password </span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden lg:block">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <SetupBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Payments
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Clients
            </TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Packages
            </TabsTrigger>
            <TabsTrigger value="timeslots" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
              Time Slots
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="users" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-gold">
                Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <BookingsView />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentsView />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsView />
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <PackagesView />
          </TabsContent>

          <TabsContent value="timeslots" className="mt-6">
            <TimeSlotsView />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users" className="mt-6">
              <UsersView />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </div>
  )
}
