"use server"

import { createAdminClient } from "@/lib/server/appwrite"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signUpWithEmail(email: string, password: string, name: string) {
  try {
    const { account } = await createAdminClient()

    await account.create("unique()", email, password, name)

    const session = await account.createEmailPasswordSession(email, password)
    ;(await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { account } = await createAdminClient()

    const session = await account.createEmailPasswordSession(email, password)
    ;(await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { success: false, error: "Invalid credentials" }
  }
}

export async function signOut() {
  try {
    const { account } = await createAdminClient()
    ;(await cookies()).delete("appwrite-session")

    await account.deleteSession("current")

    redirect("/admin/login")
  } catch (error) {
    console.error("[v0] Sign out error:", error)
  }
}

export async function getLoggedInUser() {
  try {
    const { account } = await createAdminClient()
    return await account.get()
  } catch (error) {
    return null
  }
}
