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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface UserPermissionsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UserPermissionsDialog({ isOpen, onClose }: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState({
    canEditUsers: false,
    canDeleteUsers: false,
    canEditDoctors: false,
    canDeleteDoctors: false,
    canEditPets: false,
    canDeletePets: false,
  })

  const handleSave = () => {
    // Add logic to save permissions to the backend
    console.log("Permissions saved:", permissions)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Permissions</DialogTitle>
          <DialogDescription>
            Manage user permissions for the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="canEditUsers" checked={permissions.canEditUsers} onCheckedChange={(checked) => setPermissions({ ...permissions, canEditUsers: !!checked })} />
            <Label htmlFor="canEditUsers">Can Edit Users</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canDeleteUsers" checked={permissions.canDeleteUsers} onCheckedChange={(checked) => setPermissions({ ...permissions, canDeleteUsers: !!checked })} />
            <Label htmlFor="canDeleteUsers">Can Delete Users</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canEditDoctors" checked={permissions.canEditDoctors} onCheckedChange={(checked) => setPermissions({ ...permissions, canEditDoctors: !!checked })} />
            <Label htmlFor="canEditDoctors">Can Edit Doctors</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canDeleteDoctors" checked={permissions.canDeleteDoctors} onCheckedChange={(checked) => setPermissions({ ...permissions, canDeleteDoctors: !!checked })} />
            <Label htmlFor="canDeleteDoctors">Can Delete Doctors</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canEditPets" checked={permissions.canEditPets} onCheckedChange={(checked) => setPermissions({ ...permissions, canEditPets: !!checked })} />
            <Label htmlFor="canEditPets">Can Edit Pets</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canDeletePets" checked={permissions.canDeletePets} onCheckedChange={(checked) => setPermissions({ ...permissions, canDeletePets: !!checked })} />
            <Label htmlFor="canDeletePets">Can Delete Pets</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}