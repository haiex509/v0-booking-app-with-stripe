import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/types/user-roles"
import { ROLE_PERMISSIONS } from "@/lib/types/user-roles"

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, is_active")
      .eq("user_id", userId)
      .maybeSingle()

    // If table doesn't exist, log warning and return default role
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.warn(
          "[v0] user_roles table not found. Run scripts/004_create_user_roles.sql to enable role-based access control. Defaulting to 'admin' role for authenticated users.",
        )
        // Default to admin role when table doesn't exist
        return "admin"
      }
      console.error("[v0] Error fetching user role:", error)
      return null
    }

    if (!data) {
      console.log(
        "[v0] No role found for user. Defaulting to 'admin'. Add user to user_roles table to assign specific role.",
      )
      return "admin"
    }

    if (!data.is_active) {
      return null
    }

    return data.role as UserRole
  } catch (err) {
    console.error("[v0] Exception fetching user role:", err)
    // Default to admin role on error
    return "admin"
  }
}

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  const role = await getUserRole(userId)
  if (!role) return false

  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes(permission as any)
}

export async function hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
  const userRole = await getUserRole(userId)
  if (!userRole) return false

  return roles.includes(userRole)
}

export async function requirePermission(userId: string, permission: string): Promise<void> {
  const hasPermission = await checkPermission(userId, permission)
  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export async function requireRole(userId: string, roles: UserRole[]): Promise<void> {
  const hasRole = await hasAnyRole(userId, roles)
  if (!hasRole) {
    throw new Error(`Access denied: requires one of ${roles.join(", ")}`)
  }
}
