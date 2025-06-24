"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, User, Phone, Mail, MapPin, Trash2 } from "lucide-react"
import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface MedicalRecord {
  _id: string;
  petId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  sex: string;
  owner: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  vaccinations: Array<{
    name: string;
    dateAdministered: string;
    nextDueDate: string;
    veterinarian: string;
  }>;
  medicalHistory: Array<{
    condition: string;
    diagnosisDate: string;
    treatment: string;
    status: 'ongoing' | 'resolved';
  }>;
  visitHistory: Array<{
    date: string;
    reason: string;
    notes: string;
    veterinarian: string;
  }>;
  archived?: boolean;
}

interface MedicalRecordDialogProps {
  record: MedicalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (recordId: string) => void;
  onArchive?: (recordId: string, archived: boolean) => void;
}

export function MedicalRecordDialog({ record, open, onOpenChange, onDelete, onArchive }: MedicalRecordDialogProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  if (!record) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(record._id);
      setShowDeleteConfirmation(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Record - {record.name}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
              <TabsTrigger value="visit-history">Visit History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pet Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pet Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{record.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Species:</span>
                      <span className="text-sm capitalize">{record.species}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Breed:</span>
                      <span className="text-sm">{record.breed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Age:</span>
                      <span className="text-sm">{record.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sex:</span>
                      <span className="text-sm capitalize">{record.sex}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Owner Information</h3>
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">Owner Information</div>
                    <span className="text-sm">{record.owner?.name || 'N/A'}</span>
                    <span className="text-sm">{record.owner?.phone || 'N/A'}</span>
                    <span className="text-sm">{record.owner?.email || 'N/A'}</span>
                    <span className="text-sm">{record.owner?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vaccinations" className="space-y-4">
              <h3 className="text-lg font-semibold">Vaccination History</h3>
              {record.vaccinations.length > 0 ? (
                <div className="space-y-3">
                  {record.vaccinations.map((vaccine, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{vaccine.name}</h4>
                        <Badge variant="outline">Administered</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date Administered:</span>
                          <p>{new Date(vaccine.dateAdministered).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Next Due:</span>
                          <p>{new Date(vaccine.nextDueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 text-sm">Veterinarian:</span>
                        <p className="text-sm">{vaccine.veterinarian}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No vaccination records found.</p>
              )}
            </TabsContent>

            <TabsContent value="medical-history" className="space-y-4">
              <h3 className="text-lg font-semibold">Medical History</h3>
              {record.medicalHistory.length > 0 ? (
                <div className="space-y-3">
                  {record.medicalHistory.map((condition, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{condition.condition}</h4>
                        <Badge className={
                          condition.status === 'resolved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {condition.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Diagnosis Date:</span>
                          <p>{new Date(condition.diagnosisDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 text-sm">Treatment:</span>
                        <p className="text-sm">{condition.treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No medical history records found.</p>
              )}
            </TabsContent>

            <TabsContent value="visit-history" className="space-y-4">
              <h3 className="text-lg font-semibold">Visit History</h3>
              {record.visitHistory.length > 0 ? (
                <div className="space-y-3">
                  {record.visitHistory.map((visit, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{visit.reason}</h4>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{new Date(visit.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600 text-sm">Veterinarian:</span>
                          <p className="text-sm">{visit.veterinarian}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">Notes:</span>
                          <p className="text-sm">{visit.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No visit history records found.</p>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {onDelete && (
                <Button variant="destructive" onClick={() => setShowDeleteConfirmation(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Record
                </Button>
              )}
              {onArchive && (
                <Button 
                  variant="outline" 
                  className={record.archived ? "bg-blue-100 hover:bg-blue-200" : ""}
                  onClick={() => onArchive(record._id, !record.archived)}
                >
                  {record.archived ? "Unarchive" : "Archive"}
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medical record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 