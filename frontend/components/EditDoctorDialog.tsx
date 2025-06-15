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

interface EditDoctorDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateDoctor: (doctor: any) => void
  doctor: any
  specialties?: string[]
}

export function EditDoctorDialog({ isOpen, onClose, onUpdateDoctor, doctor, specialties = [] }: EditDoctorDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    if (isOpen && doctor) {
      setName(doctor.name || "");
      setEmail(doctor.email || "");
      setPassword(doctor.password || "");
      setContact(doctor.contact || "");
      setAddress(doctor.address || "");
      setSpecialty(doctor.specialty || "");
    }
    // Do not reset on every doctor prop change, only when dialog opens
    // eslint-disable-next-line
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoctor({
      ...doctor,
      name,
      email,
      password,
      contact,
      address,
      specialty,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{doctor?._id ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
          <DialogDescription>
            {doctor?._id ? "Update the doctor's details." : "Enter details for the new doctor."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" type="email" />
            </div>
            {!doctor?._id && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" type="password" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">Contact</Label>
              <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialty" className="text-right">Specialty</Label>
              <select
                id="specialty"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="col-span-3 border rounded px-2 py-1"
              >
                <option value="">Select specialty</option>
                {specialties && specialties.map(s => (
                  <option value={s} key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{doctor?._id ? "Save Changes" : "Add Doctor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}