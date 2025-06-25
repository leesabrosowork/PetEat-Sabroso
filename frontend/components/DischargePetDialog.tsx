import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import { AlertTriangle } from 'lucide-react';

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
}

interface PetUnderTreatment {
  _id: string;
  pet: Pet;
  status: string;
  room: string;
}

interface DischargePetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDischarge: (treatmentId: string, dischargeNotes: string) => void;
  treatment: PetUnderTreatment | null;
}

export function DischargePetDialog({ open, onOpenChange, onDischarge, treatment }: DischargePetDialogProps) {
  const { toast } = useToast();
  const [dischargeNotes, setDischargeNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!treatment) {
      return;
    }

    if (!dischargeNotes) {
      toast({
        title: "Error",
        description: "Please enter discharge notes",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onDischarge(treatment._id, dischargeNotes);
      
      // Reset form
      setDischargeNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discharge pet",
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Discharge Pet
          </DialogTitle>
          <DialogDescription>
            You are about to discharge {treatment.pet?.name} from treatment. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dischargeNotes" className="text-right">
                Discharge Notes
              </Label>
              <Textarea
                id="dischargeNotes"
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                className="col-span-3"
                placeholder="Enter discharge notes, including follow-up instructions"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Discharging...' : 'Discharge Pet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DischargePetDialog; 