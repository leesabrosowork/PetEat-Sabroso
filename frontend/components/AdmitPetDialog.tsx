import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  healthStatus: string;
  profilePicture?: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
}

interface AdmitPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdmit: (petName: string, data: { ownerName: string, ownerContact: string, room: string, diagnosis: string, clinicalNotes: string }) => void;
  pets: Pet[];
}

export function AdmitPetDialog({ open, onOpenChange, onAdmit, pets }: AdmitPetDialogProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddOwner, setQuickAddOwner] = useState<{ name: string; email: string; contactNumber: string }>({ name: '', email: '', contactNumber: '' });
  const [quickAddPet, setQuickAddPet] = useState<{ name: string; species: string; breed: string; age: string; gender: string; color: string }>({ name: '', species: '', breed: '', age: '', gender: 'male', color: '' });
  // Main admit dialog breed state
  const [breed, setBreed] = useState<string>('');

  // Quick Add handler
  const handleQuickAdd = async () => {
    setQuickAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      // 1. Create owner
      const ownerRes = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: quickAddOwner.name,
          username: quickAddOwner.email,
          email: quickAddOwner.email,
          contactNumber: quickAddOwner.contactNumber,
          role: 'pet owner',
          password: 'TempPass123!'
        })
      });
      const ownerData = await ownerRes.json();
      if (!ownerRes.ok) {
        console.error('Quick Add Owner Error:', ownerData.message || ownerData.error || ownerData);
        throw new Error(ownerData.message || ownerData.error || 'Failed to create owner');
      }
      const ownerId = ownerData?.data?.user?._id;
      if (!ownerId) throw new Error('Owner creation failed');

      // 2. Create pet
      const petRes = await fetch('http://localhost:8080/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: quickAddPet.name,
          type: quickAddPet.species.toLowerCase(),
          breed: quickAddPet.breed,
          age: Number(quickAddPet.age),
          gender: quickAddPet.gender.toLowerCase(),
          color: quickAddPet.color,
          owner: ownerId
        })
      });
      if (!petRes.ok) throw new Error('Failed to create pet');
      const petData = await petRes.json();
      const petId = petData?.data?._id || petData?.data?.pet?._id || petData?.data?.petId || petData?.data?.id;
      if (!petId) throw new Error('Pet creation failed');

      // 3. Admit pet
      const admitRes = await fetch('http://localhost:8080/api/pets-under-treatment/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          petId,
          room,
          diagnosis,
          clinicalNotes
        })
      });
      if (!admitRes.ok) throw new Error('Failed to admit pet');
      toast({ title: 'Success', description: 'Pet and owner registered and pet admitted!', variant: 'default' });
      setShowQuickAdd(false);
      setPetName('');
      setOwnerName('');
      setOwnerContact('');
      setRoom('');
      setDiagnosis('');
      setClinicalNotes('');
      setQuickAddOwner({ name: '', email: '', contactNumber: '' });
      setQuickAddPet({ name: '', species: '', breed: '', age: '', gender: 'male', color: '' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to register owner/pet/admit', variant: 'destructive' });
    } finally {
      setQuickAddLoading(false);
    }
  }
  const { toast } = useToast();
  const [petName, setPetName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerContact, setOwnerContact] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!petName) {
      toast({
        title: "Error",
        description: "Please enter the pet name",
        variant: "destructive",
      });
      return;
    }
    if (!breed) {
      toast({
        title: "Error",
        description: "Please enter the breed",
        variant: "destructive",
      });
      return;
    }
    if (!ownerName) {
      toast({
        title: "Error",
        description: "Please enter the owner's name",
        variant: "destructive",
      });
      return;
    }
    if (!ownerContact) {
      toast({
        title: "Error",
        description: "Please enter the owner's contact information",
        variant: "destructive",
      });
      return;
    }
    if (!room) {
      toast({
        title: "Error",
        description: "Please enter a room number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Fetch all pets for the authenticated clinic
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      let foundPet = null;
      try {
        const res = await fetch("http://localhost:8080/api/pets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch pets");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const normalizedPetName = petName.trim().toLowerCase();
          const normalizedOwnerInput = ownerName.trim().toLowerCase();

          foundPet = data.data.find((pet: any) => {
            const matchesName = pet.name?.trim().toLowerCase() === normalizedPetName;
            if (!matchesName) return false;

            // If user didn't supply owner name just rely on the pet name
            if (!normalizedOwnerInput) return true;

            // Otherwise do a *contains* match on owner name for more tolerance
            const ownerNameDb = (pet.owner?.name || pet.owner?.fullName || "").trim().toLowerCase();
            return ownerNameDb.includes(normalizedOwnerInput);
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to look up pet. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      if (!foundPet) {
        // Show a quick add dialog/modal for staff to register owner and pet
        setShowQuickAdd(true);
        setIsSubmitting(false);
        return;
      }
      // Admit pet using petId
      try {
        const admitRes = await fetch("http://localhost:8080/api/pets-under-treatment/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            petId: foundPet._id,
            room,
            diagnosis,
            clinicalNotes,
          }),
        });
        if (!admitRes.ok) {
          const errData = await admitRes.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to admit pet");
        }
        toast({
          title: "Success",
          description: "Pet admitted for treatment!",
          variant: "default",
        });
        // Reset form
        setPetName("");
        setOwnerName("");
        setOwnerContact("");
        setRoom("");
        setDiagnosis("");
        setClinicalNotes("");
        onOpenChange(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to admit pet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to admit pet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Admit Pet for Treatment</DialogTitle>
          <DialogDescription>
            Enter pet details and treatment information to admit them to your clinic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="petName" className="text-right">
                Pet Name
              </Label>
              <Input
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="col-span-3"
                placeholder="Type pet name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breed" className="text-right">
                Breed
              </Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="col-span-3"
                placeholder="Type breed"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerName" className="text-right">
                Pet Owner Name
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="col-span-3"
                placeholder="Type owner's name"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerContact" className="text-right">
                Pet Owner Contact Info
              </Label>
              <Input
                id="ownerContact"
                value={ownerContact}
                onChange={(e) => setOwnerContact(e.target.value)}
                className="col-span-3"
                placeholder="Type owner's contact info"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Input
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Room 101"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diagnosis" className="text-right">
                Diagnosis
              </Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="col-span-3"
                placeholder="Initial diagnosis"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clinicalNotes" className="text-right">
                Clinical Notes
              </Label>
              <Textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="col-span-3"
                placeholder="Enter any initial clinical notes or observations"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Admitting...' : 'Admit Pet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {/* Quick Add Pet & Owner Modal */}
    <Dialog open={showQuickAdd} onOpenChange={(v) => { setShowQuickAdd(v); if (!v) { setQuickAddOwner({ name: '', email: '', contactNumber: '' }); setQuickAddPet({ name: '', species: '', breed: '', age: '', gender: 'male', color: '' }); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add Pet & Owner (Emergency)</DialogTitle>
          <DialogDescription>
            Pet not found. Enter details below to quickly register the pet and owner, then admit for treatment.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); handleQuickAdd(); }}>
          <div className="font-semibold">Owner Info</div>
          <div>
            <Label htmlFor="quickAddOwnerName">Owner Name</Label>
            <Input
              id="quickAddOwnerName"
              value={quickAddOwner.name}
              onChange={e => setQuickAddOwner((o: typeof quickAddOwner) => ({ ...o, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="quickAddOwnerEmail">Owner Email</Label>
            <Input
              id="quickAddOwnerEmail"
              type="email"
              value={quickAddOwner.email}
              onChange={e => setQuickAddOwner((o: typeof quickAddOwner) => ({ ...o, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="quickAddOwnerContact">Owner Contact Number</Label>
            <Input
              id="quickAddOwnerContact"
              value={quickAddOwner.contactNumber}
              onChange={e => setQuickAddOwner((o: typeof quickAddOwner) => ({ ...o, contactNumber: e.target.value }))}
              required
            />
          </div>
          <div className="font-semibold pt-2">Pet Info</div>
          <div>
            <Label htmlFor="quickAddPetName">Pet Name</Label>
            <Input
              id="quickAddPetName"
              value={quickAddPet.name}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="quickAddPetSpecies">Species</Label>
            <Input
              id="quickAddPetSpecies"
              value={quickAddPet.species}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, species: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="quickAddPetBreed">Breed</Label>
            <Input
              id="quickAddPetBreed"
              value={quickAddPet.breed}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, breed: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="quickAddPetAge">Age</Label>
            <Input
              id="quickAddPetAge"
              type="number"
              min="0"
              value={quickAddPet.age}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, age: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="quickAddPetGender">Gender</Label>
            <select
              id="quickAddPetGender"
              className="w-full border rounded px-2 py-1"
              value={quickAddPet.gender}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, gender: e.target.value }))}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <Label htmlFor="quickAddPetColor">Color</Label>
            <Input
              id="quickAddPetColor"
              value={quickAddPet.color}
              onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, color: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setShowQuickAdd(false); setQuickAddOwner((o: typeof quickAddOwner) => ({ ...o, name: '', email: '', contactNumber: '' })); setQuickAddPet((p: typeof quickAddPet) => ({ ...p, name: '', species: '', breed: '', age: '', gender: 'male', color: '' })); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={quickAddLoading}>
              {quickAddLoading ? "Registering..." : "Register & Admit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
 );
}
