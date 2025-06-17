"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface InventoryItem {
    _id: string;
    name: string;
    category: string;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

interface EMRFormData {
    petId: string;
    diagnosis: string;
    treatment: string;
    medications: Medication[];
    notes: string;
    followUpDate: string;
    status: "active" | "ongoing" | "completed";
}

interface EMRFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EMRFormData) => void;
    initialData?: EMRFormData;
    pets?: any[];
}

export function EMRForm({ isOpen, onClose, onSubmit, initialData, pets }: EMRFormProps) {
    const [formData, setFormData] = useState<EMRFormData>({
        petId: initialData?.petId || "",
        diagnosis: initialData?.diagnosis || "",
        treatment: initialData?.treatment || "",
        medications: initialData?.medications || [],
        notes: initialData?.notes || "",
        followUpDate: initialData?.followUpDate || "",
        status: initialData?.status || "active"
    });
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const { toast } = useToast();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                petId: initialData?.petId || "",
                diagnosis: initialData?.diagnosis || "",
                treatment: initialData?.treatment || "",
                medications: initialData?.medications || [],
                notes: initialData?.notes || "",
                followUpDate: initialData?.followUpDate || "",
                status: initialData?.status || "active"
            });
        }
    }, [isOpen, initialData]);

    // Fetch inventory items
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/inventory", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setInventoryItems(data.data);
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch inventory items",
                    variant: "destructive"
                });
            }
        };
        fetchInventory();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.diagnosis || !formData.treatment) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Form submission error:", error);
            toast({
                title: "Error",
                description: "Failed to submit form. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleInputChange = (field: keyof EMRFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addMedication = () => {
        setFormData(prev => ({
            ...prev,
            medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "" }]
        }));
    };

    const removeMedication = (index: number) => {
        setFormData(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            medications: prev.medications.map((med, i) => 
                i === index ? { ...med, [field]: value } : med
            )
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Medical Record" : "New Medical Record"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update the medical record details" : "Create a new medical record for the pet"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!initialData && pets && (
                        <div className="grid gap-2">
                            <Label htmlFor="petId">Select Pet</Label>
                            <select
                                id="petId"
                                value={formData.petId}
                                onChange={(e) => handleInputChange("petId", e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select a pet</option>
                                {pets.map((pet) => (
                                    <option key={pet._id} value={pet._id}>
                                        {pet.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                            id="diagnosis"
                            value={formData.diagnosis}
                            onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="treatment">Treatment</Label>
                        <Textarea
                            id="treatment"
                            value={formData.treatment}
                            onChange={(e) => handleInputChange("treatment", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Medications (Optional)</Label>
                            <Button type="button" onClick={addMedication} variant="outline">
                                Add Medication
                            </Button>
                        </div>
                        {formData.medications.map((med, index) => (
                            <div key={index} className="grid gap-4 p-4 border rounded">
                                <div className="flex justify-between">
                                    <h4 className="font-medium">Medication {index + 1}</h4>
                                    <Button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Name</Label>
                                        <Select
                                            value={med.name}
                                            onValueChange={(value) => updateMedication(index, "name", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select medication" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {inventoryItems.map((item) => (
                                                    <SelectItem key={item._id} value={item.name}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Dosage</Label>
                                        <Input
                                            value={med.dosage}
                                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Frequency</Label>
                                        <Input
                                            value={med.frequency}
                                            onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Duration</Label>
                                        <Input
                                            value={med.duration}
                                            onChange={(e) => updateMedication(index, "duration", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="followUpDate">Follow-up Date</Label>
                        <Input
                            id="followUpDate"
                            type="date"
                            value={formData.followUpDate}
                            onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => handleInputChange("status", e.target.value as "active" | "ongoing" | "completed")}
                            className="w-full p-2 border rounded"
                        >
                            <option value="active">Active</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {initialData ? "Update Record" : "Create Record"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 