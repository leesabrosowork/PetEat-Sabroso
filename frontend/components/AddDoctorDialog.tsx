import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDoctor: (doctor: any) => void;
  specialties: string[];
}

export const AddDoctorDialog: React.FC<AddDoctorDialogProps> = ({ isOpen, onClose, onAddDoctor, specialties }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    address: "",
    specialty: specialties[0] || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onAddDoctor(form);
    } catch (err: any) {
      setError(err.message || "Failed to add doctor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Doctor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" />
          <Input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" />
          <Input name="contact" placeholder="Contact" value={form.contact} onChange={handleChange} required />
          <Input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
          <select name="specialty" value={form.specialty} onChange={handleChange} className="w-full border px-3 py-2 rounded">
            {specialties.map(s => <option value={s} key={s}>{s}</option>)}
          </select>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Doctor"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
