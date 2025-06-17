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

interface EditPetDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdatePet: (pet: any) => void
  pet: any
}

export function EditPetDialog({ isOpen, onClose, onUpdatePet, pet }: EditPetDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [breed, setBreed] = useState("")
  const [age, setAge] = useState("")

  useEffect(() => {
    if (pet) {
      setName(pet.name)
      setType(pet.type)
      setBreed(pet.breed)
      setAge(pet.age)
    }
  }, [pet])

  const handleSubmit = () => {
    onUpdatePet({
      ...pet,
      name,
      type,
      breed,
      age: parseInt(age),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
          <DialogDescription>
            Update the pet's details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Input id="type" value={type} onChange={(e) => setType(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="breed" className="text-right">
              Breed
            </Label>
            <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">
              Age
            </Label>
            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}