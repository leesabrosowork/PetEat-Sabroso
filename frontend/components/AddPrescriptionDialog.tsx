"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface AddPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  pets: { _id: string; name: string; owner: { _id: string; name: string; fullName?: string; username?: string; } }[];
  users?: { _id: string; name: string; }[];
  medicines: { _id: string; item: string; stock?: number; }[];
}

export function AddPrescriptionDialog({ open, onOpenChange, onAdded, pets, medicines }: AddPrescriptionDialogProps) {
  const [formData, setFormData] = useState({
    pet: '',
    user: '',
    medicine: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically set owner when pet changes
  useEffect(() => {
    if (formData.pet) {
      const selectedPet = pets.find(p => p._id === formData.pet) as any;
      if (selectedPet?.owner?._id) {
        setFormData(prev => ({ ...prev, user: selectedPet.owner._id }));
      }
    }
  }, [formData.pet, pets]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/vet-clinic/prescriptions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Prescription added successfully" });
        onAdded();
        onOpenChange(false);
      } else {
        throw new Error('Failed to add prescription');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add prescription", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Prescription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pet">Pet (Owner)</Label>
            <Select value={formData.pet} onValueChange={value => setFormData({ ...formData, pet: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {pets.map((pet: any) => {
                  return (
                    <SelectItem key={pet._id} value={pet._id}>{`${pet.name} — ${(pet.owner?.name || pet.owner?.fullName || pet.owner?.username || 'Unnamed')}`}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="medicine">Medicine</Label>
            <Select value={formData.medicine} onValueChange={value => setFormData({ ...formData, medicine: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {medicines.map(med => (
                  <SelectItem key={med._id} value={med._id}>{med.item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Prescription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 