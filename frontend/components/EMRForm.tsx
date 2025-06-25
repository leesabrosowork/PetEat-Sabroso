"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface Pet {
  _id: string
  name: string
  type: string
  breed: string
  age: number
  gender: string
  profilePicture?: string
  owner: {
    name: string
    email: string
    contactNumber: string
  }
}

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Vaccination {
  name: string
  dateAdministered: string
  nextDueDate: string
  veterinarian: string
}

interface MedicalCondition {
  condition: string
  diagnosisDate: string
  treatment: string
  status: 'ongoing' | 'resolved'
}

interface VisitRecord {
  date: string
  reason: string
  notes: string
  veterinarian: string
}

interface InventoryItem {
  _id: string;
  item: string;
  stock: number;
  minStock: number;
  category: string;
  status: string;
  lastUpdated?: string;
}

interface EMRFormData {
  petId: string
  name: string
  species: string
  breed: string
  age: number
  sex: string
  vaccinations: Vaccination[]
  medicalHistory: MedicalCondition[]
  visitHistory: VisitRecord[]
  currentVisit: {
    date: string
    diagnosis: string
    treatment: string
    medications: Medication[]
    notes: string
    followUpDate: string
    status: "active" | "ongoing" | "completed"
  }
}

interface EMRFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EMRFormData) => void
  initialData?: EMRFormData | null
  pets: Pet[]
}

export default function EMRForm({ isOpen, onClose, onSubmit, initialData, pets }: EMRFormProps) {
  const [formData, setFormData] = useState<EMRFormData>({
    petId: "",
    name: "",
    species: "",
    breed: "",
    age: 0,
    sex: "male",
    vaccinations: [],
    medicalHistory: [],
    visitHistory: [],
    currentVisit: {
      date: new Date().toISOString().split('T')[0],
      diagnosis: "",
      treatment: "",
      medications: [],
      notes: "",
      followUpDate: "",
      status: "active"
    }
  })

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medicationsList, setMedicationsList] = useState<string[]>([]);
  const [vaccinesList, setVaccinesList] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        petId: "",
        name: "",
        species: "",
        breed: "",
        age: 0,
        sex: "male",
        vaccinations: [],
        medicalHistory: [],
        visitHistory: [],
        currentVisit: {
          date: new Date().toISOString().split('T')[0],
          diagnosis: "",
          treatment: "",
          medications: [],
          notes: "",
          followUpDate: "",
          status: "active"
        }
      })
    }
  }, [initialData])

  useEffect(() => {
    // Fetch inventory items for dropdowns
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        
        const res = await fetch("http://localhost:8080/api/vet-clinic/inventory", {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch inventory");
        }
        
        const data = await res.json();
        if (data.success) {
          const inventoryItems = data.data || [];
          setInventory(inventoryItems);
          setMedicationsList(
            inventoryItems.filter((item: InventoryItem) => 
              item.category.toLowerCase() === "medication" || 
              item.category.toLowerCase().includes("medicine")
            ).map((item: InventoryItem) => item.item)
          );
          setVaccinesList(
            inventoryItems.filter((item: InventoryItem) => 
              item.category.toLowerCase().includes("vaccine")
            ).map((item: InventoryItem) => item.item)
          );
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setInventory([]);
        setMedicationsList([]);
        setVaccinesList([]);
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    // Log pets for debugging
    console.log("EMRForm pets:", pets);
  }, [pets]);

  const handlePetChange = (petId: string) => {
    console.log("Selected pet ID:", petId);
    const selectedPet = pets.find(pet => pet._id === petId);
    console.log("Selected pet:", selectedPet);
    if (selectedPet) {
      setFormData(prev => ({
        ...prev,
        petId,
        name: selectedPet.name,
        species: selectedPet.type,
        breed: selectedPet.breed,
        age: selectedPet.age,
        sex: selectedPet.gender,
      }))
    }
  }

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      currentVisit: {
        ...prev.currentVisit,
        medications: [...prev.currentVisit.medications, { name: "", dosage: "", frequency: "", duration: "" }]
      }
    }))
  }

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      currentVisit: {
        ...prev.currentVisit,
        medications: prev.currentVisit.medications.filter((_, i) => i !== index)
      }
    }))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setFormData(prev => ({
      ...prev,
      currentVisit: {
        ...prev.currentVisit,
        medications: prev.currentVisit.medications.map((med, i) =>
          i === index ? { ...med, [field]: value } : med
        )
      }
    }))
  }

  const addVaccination = () => {
    setFormData(prev => ({
      ...prev,
      vaccinations: [...prev.vaccinations, { name: "", dateAdministered: "", nextDueDate: "", veterinarian: "" }]
    }))
  }

  const removeVaccination = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.filter((_, i) => i !== index)
    }))
  }

  const updateVaccination = (index: number, field: keyof Vaccination, value: string) => {
    setFormData(prev => ({
      ...prev,
      vaccinations: prev.vaccinations.map((vacc, i) =>
        i === index ? { ...vacc, [field]: value } : vacc
      )
    }))
  }

  const addMedicalCondition = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: [...prev.medicalHistory, { condition: "", diagnosisDate: "", treatment: "", status: "ongoing" }]
    }))
  }

  const removeMedicalCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }))
  }

  const updateMedicalCondition = (index: number, field: keyof MedicalCondition, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Medical Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="pet">Select Pet</Label>
              <Select value={formData.petId} onValueChange={handlePetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet._id} value={pet._id}>
                      {pet.name} ({pet.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pet Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Pet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="species">Species</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sex">Sex</Label>
                <Select value={formData.sex} onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Visit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Visit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitDate">Visit Date</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.currentVisit.date}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      currentVisit: { ...prev.currentVisit, date: e.target.value } 
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.currentVisit.status} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      currentVisit: { ...prev.currentVisit, status: value as "active" | "ongoing" | "completed" } 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.currentVisit.diagnosis}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentVisit: { ...prev.currentVisit, diagnosis: e.target.value } 
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="treatment">Treatment</Label>
                <Textarea
                  id="treatment"
                  value={formData.currentVisit.treatment}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentVisit: { ...prev.currentVisit, treatment: e.target.value } 
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.currentVisit.notes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentVisit: { ...prev.currentVisit, notes: e.target.value } 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.currentVisit.followUpDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    currentVisit: { ...prev.currentVisit, followUpDate: e.target.value } 
                  }))}
                />
              </div>
            </div>

            {/* Current Visit Medications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medications</h3>
                <Button type="button" onClick={addMedication} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
              {formData.currentVisit.medications.map((medication, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Name</Label>
                    <Select
                      value={medication.name}
                      onValueChange={(value) => updateMedication(index, "name", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicationsList.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      placeholder="Dosage"
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Input
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      placeholder="Frequency"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Duration</Label>
                      <Input
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                        placeholder="Duration"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Vaccinations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Vaccinations</h3>
                <Button type="button" onClick={addVaccination} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vaccination
                </Button>
              </div>
              {formData.vaccinations.map((vaccination, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Name</Label>
                    <Select
                      value={vaccination.name}
                      onValueChange={(value) => updateVaccination(index, "name", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vaccine" />
                      </SelectTrigger>
                      <SelectContent>
                        {vaccinesList.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Administered</Label>
                    <Input
                      type="date"
                      value={vaccination.dateAdministered}
                      onChange={(e) => updateVaccination(index, "dateAdministered", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Next Due Date</Label>
                    <Input
                      type="date"
                      value={vaccination.nextDueDate}
                      onChange={(e) => updateVaccination(index, "nextDueDate", e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Veterinarian</Label>
                      <Input
                        value={vaccination.veterinarian}
                        onChange={(e) => updateVaccination(index, "veterinarian", e.target.value)}
                        placeholder="Veterinarian"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVaccination(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medical History</h3>
                <Button type="button" onClick={addMedicalCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              {formData.medicalHistory.map((condition, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Condition</Label>
                    <Input
                      value={condition.condition}
                      onChange={(e) => updateMedicalCondition(index, "condition", e.target.value)}
                      placeholder="Medical condition"
                    />
                  </div>
                  <div>
                    <Label>Diagnosis Date</Label>
                    <Input
                      type="date"
                      value={condition.diagnosisDate}
                      onChange={(e) => updateMedicalCondition(index, "diagnosisDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Treatment</Label>
                    <Input
                      value={condition.treatment}
                      onChange={(e) => updateMedicalCondition(index, "treatment", e.target.value)}
                      placeholder="Treatment"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Status</Label>
                      <Select 
                        value={condition.status} 
                        onValueChange={(value) => updateMedicalCondition(index, "status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicalCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Save Medical Record
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { Pet, EMRFormData }; 