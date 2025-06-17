import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Admin {
  _id: string
  username: string
  email: string
  contact: string
  status: string
  createdAt: string
}

interface AdminManagementProps {
  admins: Admin[]
  onAdminUpdated: () => void
}

export default function AdminManagement({ admins, onAdminUpdated }: AdminManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    contact: "",
  })
  const { toast } = useToast()

  const handleCreateAdmin = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewAdmin({
          username: "",
          email: "",
          password: "",
          contact: "",
        })
        onAdminUpdated()
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/admins/${selectedAdmin._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: selectedAdmin.username,
          email: selectedAdmin.email,
          contact: selectedAdmin.contact,
          status: selectedAdmin.status,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedAdmin(null)
        onAdminUpdated()
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/admins/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin deleted successfully",
        })
        onAdminUpdated()
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Admin Management</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin._id}>
              <TableCell>{admin.username}</TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>{admin.contact}</TableCell>
              <TableCell>
                <Badge variant={admin.status === "active" ? "default" : "destructive"}>
                  {admin.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedAdmin(admin)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteAdmin(admin._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Add a new admin to the system. They will receive an email with their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                value={newAdmin.contact}
                onChange={(e) => setNewAdmin({ ...newAdmin, contact: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin}>Create Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update the admin's information.
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={selectedAdmin.username}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-contact">Contact</Label>
                <Input
                  id="edit-contact"
                  value={selectedAdmin.contact}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, contact: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedAdmin.status}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin}>Update Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 