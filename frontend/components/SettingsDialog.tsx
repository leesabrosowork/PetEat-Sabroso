"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Settings, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getUserPreferences, saveUserPreferences, clearUserPreferences } from "@/lib/storage"

interface SettingsDialogProps {
  userId: string;
}

export function SettingsDialog({ userId }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load user preferences when dialog opens
  useEffect(() => {
    if (open) {
      const preferences = getUserPreferences();
      setNotificationsEnabled(preferences.notificationsEnabled);
    }
  }, [open]);

  // Save notification preference when changed
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    saveUserPreferences({ notificationsEnabled: checked });
    toast({
      title: checked ? "Notifications Enabled" : "Notifications Disabled",
      description: checked 
        ? "You will now receive notifications about appointments and updates." 
        : "You will no longer receive notifications.",
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      
      const res = await fetch("http://localhost:8080/api/users/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) throw new Error("Failed to delete account")
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all associated data have been successfully deleted.",
        })
        
        // Clear all user data and preferences
        clearUserPreferences();
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        router.push("/")
      } else {
        throw new Error(data.message || "Failed to delete account")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Settings" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Customize your account preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about appointments and updates.
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
            <div className="border-t pt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? All your data will be lost.
              <div className="mt-4 space-y-2">
                <ul className="list-disc pl-5">
                  <li>Your personal information will be removed</li>
                  <li>All your registered pets will be deleted</li>
                  <li>All medical records will be permanently lost</li>
                  <li>All appointments and prescriptions will be deleted</li>
                </ul>
              </div>
              <p className="mt-2 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // Prevent the dialog from closing automatically
                handleDeleteAccount()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 rounded-full"></div>
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}