"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Loader2, Plus, Pencil, Trash2, Clock, Users } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { TimeSlot } from "@/lib/types/time-slots"
import { DAY_NAMES } from "@/lib/types/time-slots"
import { usePermissions } from "@/hooks/use-permissions"

export function TimeSlotsView() {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission("packages:write")

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    duration_hours: 1.0,
    max_capacity: 3,
    is_active: true,
  })

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error
      setTimeSlots(data || [])
    } catch (error) {
      console.error("Error loading time slots:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = getSupabaseBrowserClient()

      if (editingSlot) {
        // Update existing slot
        const { error } = await supabase.from("time_slots").update(formData).eq("id", editingSlot.id)

        if (error) throw error
      } else {
        // Create new slot
        const { error } = await supabase.from("time_slots").insert([formData])

        if (error) throw error
      }

      await loadTimeSlots()
      handleCloseDialog()
    } catch (error) {
      console.error("Error saving time slot:", error)
      alert("Failed to save time slot")
    }
  }

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setFormData({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_hours: slot.duration_hours,
      max_capacity: slot.max_capacity,
      is_active: slot.is_active,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("time_slots").delete().eq("id", id)

      if (error) throw error
      await loadTimeSlots()
    } catch (error) {
      console.error("Error deleting time slot:", error)
      alert("Failed to delete time slot")
    }
  }

  const handleToggleActive = async (slot: TimeSlot) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("time_slots").update({ is_active: !slot.is_active }).eq("id", slot.id)

      if (error) throw error
      await loadTimeSlots()
    } catch (error) {
      console.error("Error toggling time slot:", error)
      alert("Failed to update time slot")
    }
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingSlot(null)
    setFormData({
      day_of_week: 1,
      start_time: "09:00",
      end_time: "17:00",
      duration_hours: 1.0,
      max_capacity: 3,
      is_active: true,
    })
  }

  // Group slots by day
  const slotsByDay = timeSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.day_of_week]) {
        acc[slot.day_of_week] = []
      }
      acc[slot.day_of_week].push(slot)
      return acc
    },
    {} as Record<number, TimeSlot[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Time Slot Management</h2>
          <p className="text-zinc-400">Configure available booking times and capacity</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowDialog(true)} className="bg-gold hover:bg-gold/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
          const daySlots = slotsByDay[dayIndex] || []
          if (daySlots.length === 0) return null

          return (
            <Card key={dayIndex} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">{DAY_NAMES[dayIndex]}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {daySlots.length} time slot{daySlots.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-400" />
                          <span className="font-medium text-white">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-zinc-800 border-zinc-600 text-zinc-300">
                          {slot.duration_hours}h duration
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                          <Users className="h-4 w-4" />
                          <span>Max {slot.max_capacity}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            slot.is_active
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }
                        >
                          {slot.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(slot)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Switch checked={slot.is_active} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(slot)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{editingSlot ? "Edit Time Slot" : "Add Time Slot"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configure the time slot settings for booking availability
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="day_of_week" className="text-white">
                Day of Week
              </Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: Number.parseInt(value) })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {DAY_NAMES.map((day, index) => (
                    <SelectItem key={index} value={index.toString()} className="text-white">
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-white">
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-white">
                  End Time
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_hours" className="text-white">
                  Duration (hours)
                </Label>
                <Input
                  id="duration_hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: Number.parseFloat(e.target.value) })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity" className="text-white">
                  Max Capacity
                </Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: Number.parseInt(e.target.value) })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="text-white">
                Active
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gold hover:bg-gold/90">
                {editingSlot ? "Update" : "Create"} Time Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
