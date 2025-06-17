"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [notifications, setNotifications] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('http://localhost:8080/api/admin/settings', { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const settings = await response.json()
      setNotifications(settings.data.notifications)
      setMaintenanceMode(settings.data.maintenanceMode)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('http://localhost:8080/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ notifications, maintenanceMode })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>System Configuration</DialogTitle>
          <DialogDescription>
            Manage system-wide settings and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">
              Enable Email Notifications
            </Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode">
              Enable Maintenance Mode
            </Label>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}