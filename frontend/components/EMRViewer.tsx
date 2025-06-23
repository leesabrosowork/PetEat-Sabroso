"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface EMRViewerProps {
    emrId: string
    isOpen: boolean
    onClose: () => void
    onEdit?: (emr: any) => void
    isDoctor?: boolean
    handleDeleteEMR?: (emrId: string) => void
}

export function EMRViewer({ emrId, isOpen, onClose, onEdit, isDoctor, handleDeleteEMR }: EMRViewerProps) {
    const [emr, setEmr] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (isOpen && emrId) {
            fetchEMR()
        }
    }, [isOpen, emrId])

    const fetchEMR = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/emr/${emrId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            if (response.status === 404) {
                setEmr(null)
                setLoading(false)
                return
            }
            const data = await response.json()
            if (response.ok) {
                setEmr(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch EMR details",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <div className="flex justify-center items-center h-40">
                        Loading...
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!emr) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <div className="flex justify-center items-center h-40">
                        No EMR
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const isPetMedicalRecord = emr.recordType === 'petMedicalRecord';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Medical Record
                        {isPetMedicalRecord && (
                            <Badge variant="outline" className="ml-2">Clinic Record</Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Details for {emr.name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="medications">Medications</TabsTrigger>
                        <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                        <TabsTrigger value="medical-history">Medical History</TabsTrigger>
                        <TabsTrigger value="visit-history">Visit History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Pet Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Pet Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                                    <p>{emr.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Species</h4>
                                    <p>{emr.species}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Breed</h4>
                                    <p>{emr.breed}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Age</h4>
                                    <p>{emr.age} years</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Sex</h4>
                                    <p className="capitalize">{emr.sex}</p>
                                </div>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Owner Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                                    <p>{emr.owner?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                                    <p>{emr.owner?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                    <p>{emr.owner?.email || 'N/A'}</p>
                                </div>
                                {emr.owner?.address && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Address</h4>
                                        <p>{emr.owner.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Visit Information */}
                        {emr.currentVisit && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Current Visit</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Visit Date</h4>
                                        <p>{new Date(emr.currentVisit.date || emr.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                        <Badge
                                            variant={
                                                emr.currentVisit.status === "active"
                                                    ? "default"
                                                    : emr.currentVisit.status === "ongoing"
                                                    ? "secondary"
                                                    : "destructive"
                                            }
                                        >
                                            {emr.currentVisit.status || "Active"}
                                        </Badge>
                                    </div>
                                </div>
                                {emr.currentVisit.diagnosis && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Diagnosis</h4>
                                        <p className="whitespace-pre-wrap">{emr.currentVisit.diagnosis}</p>
                                    </div>
                                )}
                                {emr.currentVisit.treatment && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Treatment</h4>
                                        <p className="whitespace-pre-wrap">{emr.currentVisit.treatment}</p>
                                    </div>
                                )}
                                {emr.currentVisit.notes && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                                        <p className="whitespace-pre-wrap">{emr.currentVisit.notes}</p>
                                    </div>
                                )}
                                {emr.currentVisit.followUpDate && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Follow-up Date</h4>
                                        <p>{new Date(emr.currentVisit.followUpDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="medications" className="space-y-4">
                        <h3 className="text-lg font-semibold">Medications</h3>
                        {emr.currentVisit?.medications && emr.currentVisit.medications.length > 0 ? (
                            <div className="space-y-4">
                                {emr.currentVisit.medications.map((med: any, index: number) => (
                                    <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded">
                                        <div>
                                            <h5 className="font-medium">{med.name}</h5>
                                            <p className="text-sm text-gray-500">Dosage: {med.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Frequency: {med.frequency}</p>
                                            <p className="text-sm text-gray-500">Duration: {med.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No medications found for this visit.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="vaccinations" className="space-y-4">
                        <h3 className="text-lg font-semibold">Vaccination History</h3>
                        {emr.vaccinations && emr.vaccinations.length > 0 ? (
                            <div className="space-y-4">
                                {emr.vaccinations.map((vaccination: any, index: number) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded">
                                        <div>
                                            <h5 className="font-medium">{vaccination.name}</h5>
                                            <p className="text-sm text-gray-500">Administered: {new Date(vaccination.dateAdministered).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Next Due: {new Date(vaccination.nextDueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Veterinarian: {vaccination.veterinarian}</p>
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
                        {emr.medicalHistory && emr.medicalHistory.length > 0 ? (
                            <div className="space-y-4">
                                {emr.medicalHistory.map((condition: any, index: number) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                                        <div>
                                            <h5 className="font-medium">{condition.condition}</h5>
                                            <p className="text-sm text-gray-500">Diagnosis Date: {new Date(condition.diagnosisDate).toLocaleDateString()}</p>
                                            <Badge className="mt-1" variant={condition.status === 'ongoing' ? 'default' : 'secondary'}>
                                                {condition.status === 'ongoing' ? 'Ongoing' : 'Resolved'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-500">Treatment</h5>
                                            <p className="whitespace-pre-wrap">{condition.treatment}</p>
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
                        {emr.visitHistory && emr.visitHistory.length > 0 ? (
                            <div className="space-y-4">
                                {emr.visitHistory.map((visit: any, index: number) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                                        <div>
                                            <h5 className="font-medium">{visit.reason}</h5>
                                            <p className="text-sm text-gray-500">Date: {new Date(visit.date).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500">Veterinarian: {visit.veterinarian}</p>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-500">Notes</h5>
                                            <p className="whitespace-pre-wrap">{visit.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No visit history records found.</p>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Doctor Actions */}
                {isDoctor && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            onClick={() => onEdit && onEdit(emr)}
                        >
                            Edit
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handleDeleteEMR && handleDeleteEMR(emr._id)}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
