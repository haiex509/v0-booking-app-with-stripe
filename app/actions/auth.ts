"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signInAction(email: string, password: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/admin")
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
