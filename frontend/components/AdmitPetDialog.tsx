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
  onAdmit: (petId: string, data: { ownerName: string, ownerContact: string, room: string, diagnosis: string, clinicalNotes: string }) => void;
  pets: Pet[];
  onQuickAdmitSuccess?: () => void;
}

export function AdmitPetDialog({ open, onOpenChange, onAdmit, pets, onQuickAdmitSuccess }: AdmitPetDialogProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddOwner, setQuickAddOwner] = useState<{ name: string; email: string; contactNumber: string }>({ name: '', email: '', contactNumber: '' });
  const [quickAddPet, setQuickAddPet] = useState<{ name: string; species: string; breed: string; age: string; gender: string; color: string; category: string }>({ name: '', species: '', breed: '', age: '', gender: 'male', color: '', category: '' });
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [customRoom, setCustomRoom] = useState<string>('');
  const [useCustomRoom, setUseCustomRoom] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) {
      toast({ title: 'Error', description: 'Please select a pet', variant: 'destructive' });
      return;
    }
    const selectedPet = pets.find(p => p._id === selectedPetId);
    if (!selectedPet) {
      toast({ title: 'Error', description: 'Selected pet not found', variant: 'destructive' });
      return;
    }
    const roomToSend = useCustomRoom ? customRoom : room;
    if (!roomToSend) {
      toast({ title: 'Error', description: 'Please select or enter a room', variant: 'destructive' });
      return;
    }
    onAdmit(selectedPetId, {
      ownerName: selectedPet.owner?.name || 'Owner',
      ownerContact: selectedPet.owner?.email || '',
      room: roomToSend,
      diagnosis,
      clinicalNotes
    });
    setSelectedPetId('');
    setRoom('');
    setCustomRoom('');
    setUseCustomRoom(false);
    setDiagnosis('');
    setClinicalNotes('');
    onOpenChange(false);
  };

  const validateQuickAdd = () => {
    if (!quickAddOwner.name.trim()) {
      toast({ title: 'Error', description: 'Owner name is required', variant: 'destructive' });
      return false;
    }
    if (!quickAddOwner.email.trim()) {
      toast({ title: 'Error', description: 'Owner email is required', variant: 'destructive' });
      return false;
    }
    // Simple email regex
    if (!/^\S+@\S+\.\S+$/.test(quickAddOwner.email)) {
      toast({ title: 'Error', description: 'Invalid email format', variant: 'destructive' });
      return false;
    }
    if (!quickAddOwner.contactNumber.trim()) {
      toast({ title: 'Error', description: 'Owner contact number is required', variant: 'destructive' });
      return false;
    }
    if (!quickAddPet.name.trim()) {
      toast({ title: 'Error', description: 'Pet name is required', variant: 'destructive' });
      return false;
    }
    if (!quickAddPet.species.trim()) {
      toast({ title: 'Error', description: 'Pet species is required', variant: 'destructive' });
      return false;
    }
    if (!quickAddPet.age || isNaN(Number(quickAddPet.age)) || Number(quickAddPet.age) < 0) {
      toast({ title: 'Error', description: 'Pet age must be a positive number', variant: 'destructive' });
      return false;
    }
    if (!quickAddPet.gender.trim()) {
      toast({ title: 'Error', description: 'Pet gender is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleQuickAdd = async () => {
    if (!validateQuickAdd()) return;
    setQuickAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      // 1. Create owner
      const userPayload = {
        fullName: quickAddOwner.name,
        username: quickAddOwner.email,
        email: quickAddOwner.email,
        contactNumber: quickAddOwner.contactNumber,
        role: 'pet owner',
        password: 'TempPass123!'
      };
      console.log('🔍 Creating user with payload:', userPayload);
      const ownerRes = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(userPayload)
      });
      const ownerData = await ownerRes.json();
      console.log('🔍 User creation response:', ownerRes.status, ownerData);
      if (!ownerRes.ok) throw new Error(ownerData.message || ownerData.error || JSON.stringify(ownerData));
      const ownerId = ownerData?.data?.user?._id;
      if (!ownerId) throw new Error('Owner creation failed');
      // 2. Create pet
      const petPayload = {
        name: quickAddPet.name,
        type: quickAddPet.species.toLowerCase(),
        breed: quickAddPet.breed,
        age: Number(quickAddPet.age),
        gender: quickAddPet.gender.toLowerCase(),
        color: quickAddPet.color,
        owner: ownerId,
        category: quickAddPet.category
      };
      console.log('🔍 Creating pet with payload:', petPayload);
      const petRes = await fetch('http://localhost:8080/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(petPayload)
      });
      const petData = await petRes.json();
      console.log('🔍 Pet creation response:', petRes.status, petData);
      if (!petRes.ok) throw new Error(petData.message || petData.error || JSON.stringify(petData));
      const petId = petData?.data?._id || petData?.data?.pet?._id || petData?.data?.petId || petData?.data?.id;
      if (!petId) throw new Error('Pet creation failed');
      // 3. Call onAdmit with new petId
      onAdmit(petId, {
        ownerName: quickAddOwner.name,
        ownerContact: quickAddOwner.contactNumber,
        room,
        diagnosis,
        clinicalNotes
      });
      toast({ title: 'Success', description: 'Pet and owner registered and pet admitted!', variant: 'default' });
      setShowQuickAdd(false);
      setQuickAddOwner({ name: '', email: '', contactNumber: '' });
      setQuickAddPet({ name: '', species: '', breed: '', age: '', gender: 'male', color: '', category: '' });
      setRoom('');
      setDiagnosis('');
      setClinicalNotes('');
      onOpenChange(false);
      if (typeof onQuickAdmitSuccess === 'function') {
        onQuickAdmitSuccess();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || (typeof error === 'string' ? error : JSON.stringify(error)), variant: 'destructive' });
    } finally {
      setQuickAddLoading(false);
    }
  };

  const { toast } = useToast();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Admit Pet for Treatment</DialogTitle>
            <DialogDescription>
              Select a pet and enter treatment information to admit them to your clinic.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-2 flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowQuickAdd(true)}>
              Admit Emergency (Not in Database)
            </Button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="petSelect" className="text-right">Pet</Label>
                <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet._id} value={pet._id}>
                        {pet.name} ({pet.breed}, {pet.owner?.name || 'Owner'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">Room</Label>
                {!useCustomRoom ? (
                  <Select value={room} onValueChange={value => {
                    if (value === 'Other') {
                      setUseCustomRoom(true);
                      setRoom('');
                    } else {
                      setRoom(value);
                      setCustomRoom('');
                      setUseCustomRoom(false);
                    }
                  }} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Room 1">Room 1</SelectItem>
                      <SelectItem value="Room 2">Room 2</SelectItem>
                      <SelectItem value="Room 3">Room 3</SelectItem>
                      <SelectItem value="Room 4">Room 4</SelectItem>
                      <SelectItem value="Room 5">Room 5</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Recovery">Recovery</SelectItem>
                      <SelectItem value="Surgery">Surgery</SelectItem>
                      <SelectItem value="Isolation">Isolation</SelectItem>
                      <SelectItem value="Other">Other (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="customRoom"
                      value={customRoom}
                      onChange={e => setCustomRoom(e.target.value)}
                      placeholder="Enter custom room name"
                      required
                    />
                    <Button type="button" variant="secondary" onClick={() => setUseCustomRoom(false)}>
                      Back
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="diagnosis" className="text-right">Diagnosis</Label>
                <Input id="diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="col-span-3" placeholder="Initial diagnosis" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clinicalNotes" className="text-right">Clinical Notes</Label>
                <Textarea id="clinicalNotes" value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} className="col-span-3" placeholder="Enter any initial clinical notes or observations" rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Admitting...' : 'Admit Pet'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Quick Add Pet & Owner Modal */}
      <Dialog open={showQuickAdd} onOpenChange={(v) => { setShowQuickAdd(v); if (!v) { setQuickAddOwner({ name: '', email: '', contactNumber: '' }); setQuickAddPet({ name: '', species: '', breed: '', age: '', gender: 'male', color: '', category: '' }); } }}>
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
              <Label htmlFor="quickAddPetCategory">Category</Label>
              <select
                id="quickAddPetCategory"
                value={quickAddPet.category}
                onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, category: e.target.value }))}
                required
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Select category</option>
                <option value="Mammals">Mammals</option>
                <option value="Birds">Birds</option>
                <option value="Fish">Fish</option>
                <option value="Reptiles">Reptiles</option>
                <option value="Amphibians">Amphibians</option>
              </select>
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
                required
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
                value={quickAddPet.gender}
                onChange={e => setQuickAddPet((p: typeof quickAddPet) => ({ ...p, gender: e.target.value }))}
                required
                className="w-full border rounded px-2 py-1"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
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
              <Button type="button" variant="outline" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={quickAddLoading}>{quickAddLoading ? 'Registering...' : 'Register & Admit'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
