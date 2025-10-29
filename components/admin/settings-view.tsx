"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateAdminCode, getDefaultCode } from "@/lib/admin-auth"
import { Lock, Check, AlertCircle } from "lucide-react"

export function SettingsView() {
  const [currentCode, setCurrentCode] = useState("")
  const [newCode, setNewCode] = useState("")
  const [confirmCode, setConfirmCode] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateCode = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    // Validate inputs
    if (!currentCode || !newCode || !confirmCode) {
      setMessage({ type: "error", text: "All fields are required" })
      setIsLoading(false)
      return
    }

    if (newCode !== confirmCode) {
      setMessage({ type: "error", text: "New codes do not match" })
      setIsLoading(false)
      return
    }

    if (newCode.length < 6) {
      setMessage({ type: "error", text: "New code must be at least 6 characters" })
      setIsLoading(false)
      return
    }

    // Update the code
    const result = updateAdminCode(currentCode, newCode)

    if (result.success) {
      setMessage({ type: "success", text: "Access code updated successfully" })
      setCurrentCode("")
      setNewCode("")
      setConfirmCode("")
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update code" })
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-zinc-400">Manage your admin access code</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-code" className="text-white">
                Current Access Code
              </Label>
              <Input
                id="current-code"
                type="password"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                placeholder="Enter current code"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-code" className="text-white">
                New Access Code
              </Label>
              <Input
                id="new-code"
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Enter new code (min 6 characters)"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-code" className="text-white">
                Confirm New Code
              </Label>
              <Input
                id="confirm-code"
                type="password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Confirm new code"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                }`}
              >
                {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              {isLoading ? "Updating..." : "Update Access Code"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400">
              <strong className="text-white">Default Code:</strong> {getDefaultCode()}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              This is the initial access code. Make sure to change it for security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
