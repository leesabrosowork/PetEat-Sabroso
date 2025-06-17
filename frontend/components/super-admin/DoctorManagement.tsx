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

interface Doctor {
  _id: string
  name: string
  email: string
  contact: string
  specialty: string
  availability: string
  status: string
  createdAt: string
}

interface DoctorManagementProps {
  doctors: Doctor[]
  onDoctorUpdated: () => void
}

export default function DoctorManagement({ doctors, onDoctorUpdated }: DoctorManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    specialty: "",
    availability: "weekdays",
  })
  const { toast } = useToast()

  const handleCreateDoctor = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDoctor),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Doctor created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewDoctor({
          name: "",
          email: "",
          password: "",
          contact: "",
          specialty: "",
          availability: "weekdays",
        })
        onDoctorUpdated()
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
        description: "Failed to create doctor",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/doctors/${selectedDoctor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedDoctor.name,
          email: selectedDoctor.email,
          contact: selectedDoctor.contact,
          specialty: selectedDoctor.specialty,
          availability: selectedDoctor.availability,
          status: selectedDoctor.status,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Doctor updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedDoctor(null)
        onDoctorUpdated()
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
        description: "Failed to update doctor",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/doctors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Doctor deleted successfully",
        })
        onDoctorUpdated()
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
        description: "Failed to delete doctor",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Doctor Management</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => (
            <TableRow key={doctor._id}>
              <TableCell>{doctor.name}</TableCell>
              <TableCell>{doctor.email}</TableCell>
              <TableCell>{doctor.contact}</TableCell>
              <TableCell>{doctor.specialty}</TableCell>
              <TableCell>{doctor.availability}</TableCell>
              <TableCell>
                <Badge variant={doctor.status === "active" ? "default" : "destructive"}>
                  {doctor.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedDoctor(doctor)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteDoctor(doctor._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Doctor Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Doctor</DialogTitle>
            <DialogDescription>
              Add a new doctor to the system. They will receive an email with their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newDoctor.password}
                onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                value={newDoctor.contact}
                onChange={(e) => setNewDoctor({ ...newDoctor, contact: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={newDoctor.specialty}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                className="w-full px-3 py-2 border rounded-md"
                value={newDoctor.availability}
                onChange={(e) => setNewDoctor({ ...newDoctor, availability: e.target.value })}
              >
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDoctor}>Create Doctor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the doctor's information.
            </DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={selectedDoctor.name}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedDoctor.email}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-contact">Contact</Label>
                <Input
                  id="edit-contact"
                  value={selectedDoctor.contact}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, contact: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-specialty">Specialty</Label>
                <Input
                  id="edit-specialty"
                  value={selectedDoctor.specialty}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, specialty: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-availability">Availability</Label>
                <select
                  id="edit-availability"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedDoctor.availability}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, availability: e.target.value })
                  }
                >
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedDoctor.status}
                  onChange={(e) =>
                    setSelectedDoctor({ ...selectedDoctor, status: e.target.value })
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
            <Button onClick={handleUpdateDoctor}>Update Doctor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 