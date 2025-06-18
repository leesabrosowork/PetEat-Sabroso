"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, User, Pill, FileText } from "lucide-react"

interface Prescription {
  _id: string;
  pet: {
    _id: string;
    name: string;
    breed: string;
    age: number;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  medicine: {
    item: string;
  };
  description: string;
  createdAt: string;
}

interface PrescriptionDetailsDialogProps {
  prescription: Prescription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrescriptionDetailsDialog({ prescription, open, onOpenChange }: PrescriptionDetailsDialogProps) {
  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prescription Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prescription Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Prescribed on:</span>
              <span className="text-sm">{new Date(prescription.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Pill className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Medicine:</span>
              <span className="text-sm">{prescription.medicine?.item || 'N/A'}</span>
            </div>
          </div>

          {/* Pet Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pet Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{prescription.pet?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Breed:</span>
                <span className="text-sm">{prescription.pet?.breed || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Age:</span>
                <span className="text-sm">{prescription.pet?.age || 'N/A'} years</span>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Owner Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{prescription.user?.name || 'N/A'}</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">{prescription.user?.email || 'N/A'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Prescription Details</h3>
            <div className="flex items-start space-x-2">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="text-sm bg-gray-50 p-3 rounded-lg flex-1">
                {prescription.description || 'No description provided'}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 