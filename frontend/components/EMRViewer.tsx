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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Medical Record</DialogTitle>
                    <DialogDescription>
                        Details for {emr.pet.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Pet</h4>
                            <p>{emr.pet.name}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                            <p>{emr.owner.name}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Doctor</h4>
                            <p>{emr.doctor.name}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Visit Date</h4>
                            <p>{new Date(emr.visitDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                        <Badge
                            variant={
                                emr.status === "active"
                                    ? "default"
                                    : emr.status === "ongoing"
                                    ? "secondary"
                                    : "destructive"
                            }
                        >
                            {emr.status}
                        </Badge>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Diagnosis</h4>
                        <p className="whitespace-pre-wrap">{emr.diagnosis}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Treatment</h4>
                        <p className="whitespace-pre-wrap">{emr.treatment}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Medications</h4>
                        <div className="space-y-4">
                            {emr.medications.map((med: any, index: number) => (
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
                    </div>

                    {emr.notes && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h4>
                            <p className="whitespace-pre-wrap">{emr.notes}</p>
                        </div>
                    )}

                    {emr.followUpDate && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Follow-up Date</h4>
                            <p>{new Date(emr.followUpDate).toLocaleDateString()}</p>
                        </div>
                    )}

                    {emr.attachments && emr.attachments.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
                            <div className="space-y-2">
                                {emr.attachments.map((attachment: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            {attachment.description || `Attachment ${index + 1}`}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isDoctor && handleDeleteEMR && (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteEMR(emr._id)}>
                                Delete Record
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
