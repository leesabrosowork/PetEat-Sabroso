import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface VetClinic {
  _id: string;
  clinicName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  businessPermit: string;
  status: string;
  rejectionReason?: string;
}

export default function VetClinicApproval() {
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const fetchPendingClinics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/super-admin/pending-vet-clinics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClinics(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending clinics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending clinics",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPendingClinics();
  }, []);

  const handleApprove = async (clinicId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/super-admin/vet-clinics/${clinicId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Vet clinic approved successfully",
        });
        fetchPendingClinics();
      }
    } catch (error) {
      console.error('Error approving clinic:', error);
      toast({
        title: "Error",
        description: "Failed to approve vet clinic",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedClinic || !rejectionReason) return;

    try {
      const response = await fetch(`http://localhost:8080/api/super-admin/vet-clinics/${selectedClinic._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Vet clinic rejected successfully",
        });
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedClinic(null);
        fetchPendingClinics();
      }
    } catch (error) {
      console.error('Error rejecting clinic:', error);
      toast({
        title: "Error",
        description: "Failed to reject vet clinic",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (clinic: VetClinic) => {
    setSelectedClinic(clinic);
    setIsRejectDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pending Vet Clinic Approvals</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Clinic Name</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>License Number</TableHead>
            <TableHead>Business Permit</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clinics.filter(clinic => clinic).map((clinic) => (
            <TableRow key={clinic._id}>
              <TableCell>{clinic.clinicName}</TableCell>
              <TableCell>{clinic.ownerName}</TableCell>
              <TableCell>{clinic.email}</TableCell>
              <TableCell>{clinic.phoneNumber}</TableCell>
              <TableCell>{clinic.licenseNumber}</TableCell>
              <TableCell>
                <a
                  href={`http://localhost:8080/${clinic.businessPermit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Permit
                </a>
              </TableCell>
              <TableCell>
                <div className="space-x-2">
                  <Button
                    variant="default"
                    onClick={() => handleApprove(clinic._id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog(clinic)}
                  >
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vet Clinic Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 