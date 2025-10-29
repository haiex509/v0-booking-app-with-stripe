"use server"

import { createClient } from "@supabase/supabase-js"

// Create admin client with service role key for admin operations
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createUserRole(email: string, role: string, createdBy: string) {
  try {
    const adminClient = getAdminClient()

    // Look up user by email in auth.users
    const {
      data: { users },
      error: listError,
    } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error("[v0] Error listing users:", listError)
      return { error: "Failed to verify user exists in authentication system" }
    }

    const authUser = users.find((u) => u.email === email)

    if (!authUser) {
      return { error: "User not found. Please create the user account in Supabase Auth first." }
    }

    // Check if role already exists
    const { data: existingRole } = await adminClient.from("user_roles").select("id").eq("user_id", authUser.id).single()

    if (existingRole) {
      return { error: "User already has a role assigned" }
    }

    // Create user role
    const { data, error } = await adminClient
      .from("user_roles")
      .insert({
        user_id: authUser.id,
        email: email,
        role: role,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating user role:", error)
      return { error: "Failed to create user role" }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[v0] Exception in createUserRole:", err)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateUserRole(roleId: string, role: string) {
  try {
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
      .from("user_roles")
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roleId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating user role:", error)
      return { error: "Failed to update user role" }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[v0] Exception in updateUserRole:", err)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteUserRole(roleId: string) {
  try {
    const adminClient = getAdminClient()

    const { error } = await adminClient.from("user_roles").delete().eq("id", roleId)

    if (error) {
      console.error("[v0] Error deleting user role:", error)
      return { error: "Failed to delete user role" }
    }

    return { error: null }
  } catch (err) {
    console.error("[v0] Exception in deleteUserRole:", err)
    return { error: "An unexpected error occurred" }
  }
}

export async function toggleUserActive(roleId: string, isActive: boolean) {
  try {
    const adminClient = getAdminClient()

    const { error } = await adminClient.from("user_roles").update({ is_active: isActive }).eq("id", roleId)

    if (error) {
      console.error("[v0] Error toggling user status:", error)
      return { error: "Failed to update user status" }
    }

    return { error: null }
  } catch (err) {
    console.error("[v0] Exception in toggleUserActive:", err)
    return { error: "An unexpected error occurred" }
  }
}
