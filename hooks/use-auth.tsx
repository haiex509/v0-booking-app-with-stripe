"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { account } from "@/lib/appwrite"
import type { Models } from "appwrite"

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const currentUser = await account.get()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      await account.createEmailPasswordSession(email, password)
      const currentUser = await account.get()
      setUser(currentUser)
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  async function register(email: string, password: string, name: string) {
    try {
      await account.create("unique()", email, password, name)
      await login(email, password)
    } catch (error) {
      console.error("[v0] Register error:", error)
      throw error
    }
  }

  async function logout() {
    try {
      await account.deleteSession("current")
      setUser(null)
    } catch (error) {
      console.error("[v0] Logout error:", error)
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
