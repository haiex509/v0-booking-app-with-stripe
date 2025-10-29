"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, Trash2, Search, Shield } from "lucide-react"
import {
  type UserRoleData,
  type UserRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
} from "@/lib/types/user-roles"
import { useAuth } from "@/hooks/use-auth"
import { createUserRole, updateUserRole, deleteUserRole, toggleUserActive } from "@/app/actions/user-management"

export function UsersView() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRoleData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserRoleData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRoleData | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    role: "viewer" as UserRole,
  })

  useEffect(() => {
    loadUsers()
    loadCurrentUserRole()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, roleFilter])

  const loadCurrentUserRole = async () => {
    if (!user) return

    const supabase = getSupabaseBrowserClient()
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          console.warn(
            "[v0] user_roles table not found. Please run scripts/004_create_user_roles.sql to enable user management.",
          )
          setCurrentUserRole("admin")
          return
        }
        console.error("[v0] Error loading current user role:", error)
        return
      }

      if (data) {
        setCurrentUserRole(data.role as UserRole)
      } else {
        console.warn("[v0] No role found for current user, defaulting to admin")
        setCurrentUserRole("admin")
      }
    } catch (err) {
      console.error("[v0] Exception loading current user role:", err)
      setCurrentUserRole("admin")
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          console.warn(
            "[v0] user_roles table not found. Please run scripts/004_create_user_roles.sql to enable user management.",
          )
          setUsers([])
          setLoading(false)
          return
        }
        console.error("Error loading users:", error)
        setUsers([])
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      console.error("[v0] Exception loading users:", err)
      setUsers([])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let result = [...users]

    if (searchTerm) {
      result = result.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(result)
  }

  const handleOpenDialog = (user?: UserRoleData) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: "",
        role: "viewer",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData({ email: "", role: "viewer" })
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingUser) {
        const result = await updateUserRole(editingUser.id, formData.role)

        if (result.error) {
          alert(result.error)
        } else {
          await loadUsers()
          handleCloseDialog()
        }
      } else {
        if (!user?.id) {
          alert("You must be logged in to create user roles")
          return
        }

        const result = await createUserRole(formData.email, formData.role, user.id)

        if (result.error) {
          alert(result.error)
        } else {
          await loadUsers()
          handleCloseDialog()
        }
      }
    } catch (err) {
      console.error("[v0] Error submitting form:", err)
      alert("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user's access?")) return

    const result = await deleteUserRole(userId)

    if (result.error) {
      alert(result.error)
    } else {
      await loadUsers()
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserActive(userId, !currentStatus)

    if (result.error) {
      alert(result.error)
    } else {
      await loadUsers()
    }
  }

  const canManageUsers = currentUserRole === "super_admin"
  const canEditUser = (userRole: UserRole) => {
    if (currentUserRole === "super_admin") return true
    if (currentUserRole === "admin" && userRole !== "super_admin") return true
    return false
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "admin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "manager":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "viewer":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  if (users.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage admin access and permissions</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">User Roles Not Configured</h3>
          <p className="text-muted-foreground mb-4">
            The user_roles table hasn't been created yet. Run the SQL script to enable role-based access control.
          </p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-mono mb-2">scripts/004_create_user_roles.sql</p>
            <p className="text-muted-foreground">
              Run this script in your Supabase SQL Editor to create the user_roles table and enable user management.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage admin access and permissions</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ROLE_PERMISSIONS[user.role].slice(0, 2).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm.replace("_", " ")}
                        </Badge>
                      ))}
                      {ROLE_PERMISSIONS[user.role].length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{ROLE_PERMISSIONS[user.role].length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEditUser(user.role) && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user.id, user.is_active)}>
                            {user.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User Role" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the user's role and permissions" : "Assign a role to an existing user account"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  required
                />
                {!editingUser && (
                  <p className="text-xs text-muted-foreground">User must already exist in Supabase Auth</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUserRole === "super_admin" && (
                      <SelectItem value="super_admin">
                        <div>
                          <div className="font-medium">{ROLE_LABELS.super_admin}</div>
                          <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.super_admin}</div>
                        </div>
                      </SelectItem>
                    )}
                    <SelectItem value="admin">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.admin}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.admin}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.manager}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.manager}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div>
                        <div className="font-medium">{ROLE_LABELS.viewer}</div>
                        <div className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS.viewer}</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-sm font-medium">Permissions for {ROLE_LABELS[formData.role]}:</p>
                <div className="flex flex-wrap gap-1">
                  {ROLE_PERMISSIONS[formData.role].map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingUser ? "Update" : "Add"} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
