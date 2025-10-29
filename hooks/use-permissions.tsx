"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getUserRole, checkPermission } from "@/lib/rbac"
import type { UserRole } from "@/lib/types/user-roles"

export function usePermissions() {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadRole()
    } else {
      setRole(null)
      setLoading(false)
    }
  }, [user])

  const loadRole = async () => {
    if (!user) return
    setLoading(true)
    try {
      const userRole = await getUserRole(user.id)
      setRole(userRole)
    } catch (error) {
      console.error("[v0] Error loading user role:", error)
      // Default to admin role on error
      setRole("admin")
    }
    setLoading(false)
  }

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user) return false
    try {
      return await checkPermission(user.id, permission)
    } catch (error) {
      console.error("[v0] Error checking permission:", error)
      return false
    }
  }

  const can = (permission: string): boolean => {
    if (!role) return false
    const { ROLE_PERMISSIONS } = require("@/lib/types/user-roles")
    return ROLE_PERMISSIONS[role]?.includes(permission) || false
  }

  return {
    role,
    loading,
    hasPermission,
    can,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isManager: role === "manager",
    isViewer: role === "viewer",
  }
}
