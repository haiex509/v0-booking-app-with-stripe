export type UserRole = "super_admin" | "admin" | "manager" | "viewer"

export interface UserRoleData {
  id: string
  user_id: string
  email: string
  role: UserRole
  permissions: string[]
  created_at: string
  updated_at: string
  created_by: string | null
  is_active: boolean
}

export const ROLE_PERMISSIONS = {
  super_admin: [
    "manage_users",
    "manage_packages",
    "manage_bookings",
    "view_payments",
    "manage_settings",
    "refund_payments",
  ],
  admin: ["manage_packages", "manage_bookings", "view_payments", "refund_payments"],
  manager: ["view_packages", "manage_bookings", "view_payments"],
  viewer: ["view_packages", "view_bookings", "view_payments"],
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Full access to all features including user management",
  admin: "Can manage packages, bookings, and process refunds",
  manager: "Can manage bookings and view reports",
  viewer: "Read-only access to view data",
}
