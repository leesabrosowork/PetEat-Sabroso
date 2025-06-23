import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

interface Owner {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
}

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  owner?: Owner;
}

interface PetUnderTreatment {
  _id: string;
  pet: Pet;
  status: 'Critical' | 'Stable' | 'Improving' | 'Recovered';
  room: string;
  clinicalNotes: string;
  diagnosis: string;
}

interface UpdateTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (treatmentId: string, data: { status: string, clinicalNotes: string, room?: string }) => void;
  treatment: PetUnderTreatment | null;
}

export function UpdateTreatmentDialog({ open, onOpenChange, onUpdate, treatment }: UpdateTreatmentDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when treatment changes
  useEffect(() => {
    if (treatment) {
      setStatus(treatment.status);
      setRoom(treatment.room);
      setClinicalNotes(''); // Reset clinical notes for new entries
    }
  }, [treatment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!treatment) {
      return;
    }

    if (!status) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    if (!clinicalNotes) {
      toast({
        title: "Error",
        description: "Please enter clinical notes",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onUpdate(treatment._id, {
        status,
        clinicalNotes,
        room
      });
      
      // Reset form
      setClinicalNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update treatment status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!treatment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Treatment Status</DialogTitle>
          <DialogDescription>
            Update the status and add notes for {treatment.pet?.name}
          </DialogDescription>
        </DialogHeader>
        {/* Owner Info Section */}
        {treatment.pet?.owner && (
          <div className="mb-4 p-3 rounded bg-gray-50 border">
            <div className="font-semibold">Owner Information</div>
            <div>Name: {treatment.pet.owner.fullName || treatment.pet.owner.name || 'N/A'}</div>
            <div>Email: {treatment.pet.owner.email || 'N/A'}</div>
            <div>Contact: {treatment.pet.owner.contactNumber || 'N/A'}</div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Improving">Improving</SelectItem>
                    <SelectItem value="Recovered">Recovered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="clinicalNotes" className="text-right">
                Clinical Notes
              </Label>
              <Textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="col-span-3"
                placeholder="Enter updated clinical notes or observations"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateTreatmentDialog; 