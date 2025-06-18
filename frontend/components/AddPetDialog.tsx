"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  users: { _id: string; name: string; }[];
}

export function AddPetDialog({ open, onOpenChange, onAdded, users }: AddPetDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    breed: '',
    age: 1,
    color: '',
    gender: 'male',
    owner: '',
    healthStatus: 'stable',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/vet-clinic/pets", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Pet added successfully" });
        onAdded();
        onOpenChange(false);
      } else {
        throw new Error('Failed to add pet');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add pet", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={value => setFormData({ ...formData, type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="hamster">Hamster</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={value => setFormData({ ...formData, gender: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="owner">Owner</Label>
            <Select value={formData.owner} onValueChange={value => setFormData({ ...formData, owner: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="healthStatus">Health Status</Label>
            <Select value={formData.healthStatus} onValueChange={value => setFormData({ ...formData, healthStatus: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Pet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 