import { redirect } from "next/navigation"
import { createSessionClient } from "@/lib/server/appwrite"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"

export default async function AdminDashboard() {
  try {
    const { account } = await createSessionClient()
    await account.get()
  } catch {
    redirect("/admin/login")
  }

  return <AdminDashboardClient />
}
