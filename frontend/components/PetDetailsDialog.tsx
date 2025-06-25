"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  healthStatus: 'stable' | 'checkup' | 'critical';
  owner: {
    _id: string;
    name: string;
    email: string;
  };
}

interface PetDetailsDialogProps {
  pet: Pet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PetDetailsDialog({ pet, open, onOpenChange, onUpdate }: PetDetailsDialogProps) {
  const [healthStatus, setHealthStatus] = useState(pet?.healthStatus || 'stable')
  const [isUpdating, setIsUpdating] = useState(false)

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checkup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'stable':
        return <CheckCircle className="w-4 h-4" />;
      case 'checkup':
        return <Clock className="w-4 h-4" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleUpdateHealthStatus = async () => {
    if (!pet) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/vet-clinic/pets/${pet._id}/health-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ healthStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet health status updated successfully",
        });
        onUpdate();
        onOpenChange(false);
      } else {
        throw new Error('Failed to update health status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pet health status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!pet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pet Details - {pet.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">{pet.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Breed</label>
              <p className="text-sm text-gray-900">{pet.breed}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Age</label>
              <p className="text-sm text-gray-900">{pet.age} years</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <p className="text-sm text-gray-900 capitalize">{pet.gender}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Owner</label>
            <p className="text-sm text-gray-900">{pet.owner?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{pet.owner?.email || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Health Status</label>
            <div className="flex items-center space-x-2 mt-1">
              <Select value={healthStatus} onValueChange={(value: 'stable' | 'checkup' | 'critical') => setHealthStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={getHealthStatusColor(healthStatus)}>
                {getHealthStatusIcon(healthStatus)}
                <span className="ml-1 capitalize">{healthStatus}</span>
              </Badge>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHealthStatus} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 