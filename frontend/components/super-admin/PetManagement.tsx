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
import { Edit, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Pet {
  _id: string
  name: string
  type: string
  breed: string
  age: number
  owner: {
    username: string
    email: string
  }
  createdAt: string
}

interface PetManagementProps {
  pets: Pet[]
  onPetUpdated: () => void
}

export default function PetManagement({ pets, onPetUpdated }: PetManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [newPet, setNewPet] = useState({
    name: "",
    type: "",
    breed: "",
    age: 0,
    owner: "",
  })
  const { toast } = useToast()

  const handleCreatePet = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPet),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewPet({
          name: "",
          type: "",
          breed: "",
          age: 0,
          owner: "",
        })
        onPetUpdated()
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
        description: "Failed to create pet",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePet = async () => {
    if (!selectedPet) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/pets/${selectedPet._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedPet.name,
          type: selectedPet.type,
          breed: selectedPet.breed,
          age: selectedPet.age,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedPet(null)
        onPetUpdated()
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
        description: "Failed to update pet",
        variant: "destructive",
      })
    }
  }

  const handleDeletePet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pet?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/pets/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet deleted successfully",
        })
        onPetUpdated()
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
        description: "Failed to delete pet",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pet Management</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pet
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Breed</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pets.map((pet) => (
            <TableRow key={pet._id}>
              <TableCell>{pet.name}</TableCell>
              <TableCell>{pet.type}</TableCell>
              <TableCell>{pet.breed}</TableCell>
              <TableCell>{pet.age}</TableCell>
              <TableCell>
                <div>
                  <div>{pet.owner.username}</div>
                  <div className="text-sm text-gray-500">{pet.owner.email}</div>
                </div>
              </TableCell>
              <TableCell>{new Date(pet.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedPet(pet)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeletePet(pet._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Pet Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Pet</DialogTitle>
            <DialogDescription>
              Add a new pet to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPet.name}
                onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={newPet.type}
                onChange={(e) => setNewPet({ ...newPet, type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={newPet.breed}
                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={newPet.age}
                onChange={(e) => setNewPet({ ...newPet, age: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner ID</Label>
              <Input
                id="owner"
                value={newPet.owner}
                onChange={(e) => setNewPet({ ...newPet, owner: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePet}>Create Pet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>
              Update the pet's information.
            </DialogDescription>
          </DialogHeader>
          {selectedPet && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={selectedPet.name}
                  onChange={(e) =>
                    setSelectedPet({ ...selectedPet, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Input
                  id="edit-type"
                  value={selectedPet.type}
                  onChange={(e) =>
                    setSelectedPet({ ...selectedPet, type: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-breed">Breed</Label>
                <Input
                  id="edit-breed"
                  value={selectedPet.breed}
                  onChange={(e) =>
                    setSelectedPet({ ...selectedPet, breed: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={selectedPet.age}
                  onChange={(e) =>
                    setSelectedPet({ ...selectedPet, age: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePet}>Update Pet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 