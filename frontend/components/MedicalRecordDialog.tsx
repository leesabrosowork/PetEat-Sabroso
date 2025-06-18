"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, User, Phone, Mail, MapPin } from "lucide-react"

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
}

interface MedicalRecordDialogProps {
  record: MedicalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicalRecordDialog({ record, open, onOpenChange }: MedicalRecordDialogProps) {
  if (!record) return null;

  return (
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{record.owner.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{record.owner.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{record.owner.email}</span>
                  </div>
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 