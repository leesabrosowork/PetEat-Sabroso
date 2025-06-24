"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  availability: 'available' | 'not available';
}

interface Clinic {
  _id: string;
  clinicName: string;
  location?: { address?: string; city?: string; province?: string };
  operatingHours?: { mondayToFriday?: string; saturday?: string; sunday?: string };
  role?: string;
  userType?: string;
}

interface TimeSlot {
  startTime: number;
  endTime: number;
}

// Add a utility to get the day of week and parse operating hours
function getDayKey(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'mondayToFriday';
}

function parseTimeRange(range: string) {
  if (!range || range.toLowerCase() === 'closed') return null;
  const [start, end] = range.split('-');
  return { start, end };
}

function isTimeInRange(time: Date, start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const tMinutes = time.getHours() * 60 + time.getMinutes();
  return tMinutes >= startMinutes && tMinutes < endMinutes;
}

export default function ScheduleAppointment() {
  const [step, setStep] = useState(0)
  const [pets, setPets] = useState<Pet[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState({
    appointmentType: "",
    clinicId: "",
    petId: "",
    doctorId: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }
        // Fetch user's pets
        const petsResponse = await fetch('http://localhost:8080/api/users/pets', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const petsData = await petsResponse.json()
        if (petsData.success) setPets(petsData.data)
        // Fetch all doctors
        const doctorsResponse = await fetch('http://localhost:8080/api/bookings/doctors', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const doctorsData = await doctorsResponse.json()
        if (doctorsData.success) setDoctors(doctorsData.data)
        // Fetch all clinics (public)
        const clinicsResponse = await fetch('http://localhost:8080/api/vet-clinic/all-clinics')
        const clinicsData = await clinicsResponse.json()
        if (clinicsData.success) setClinics(clinicsData.data)
      } catch (error) {
        toast({ title: "Error", description: "Failed to load initial data. Please try again.", variant: "destructive" })
      } finally {
        setInitialLoading(false)
      }
    }
    fetchInitialData()
  }, [router, toast])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.clinicId || !formData.date) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:8080/api/bookings/available-slots?clinicId=${formData.clinicId}&date=${formData.date}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();
        if (data.success) setAvailableSlots(data.data);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load available time slots.", variant: "destructive" });
      }
    };
    fetchAvailableSlots();
  }, [formData.clinicId, formData.date, toast]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTimeSlotSelect = (startTime: number) => {
    const selectedSlot = availableSlots.find(slot => slot.startTime === startTime)
    if (selectedSlot) {
      setFormData(prev => ({
        ...prev,
        startTime: selectedSlot.startTime.toString(),
        endTime: selectedSlot.endTime.toString()
      }))
    }
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Map frontend type to backend type
      const typeMap: Record<string, string> = {
        video: "consultation",
        inperson: "checkup", // adjust if you want a different mapping
      };
      // Convert startTime (timestamp) to "HH:mm"
      let appointmentTime = "";
      if (formData.startTime) {
        const date = new Date(parseInt(formData.startTime));
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        appointmentTime = `${hours}:${minutes}`;
      }
      const requestData = {
        petId: formData.petId,
        clinicId: formData.clinicId,
        bookingDate: formData.date,
        appointmentTime,
        reason: formData.notes,
        type: typeMap[formData.appointmentType],
      };
      console.log('Submitting booking:', requestData);
      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Appointment scheduled successfully!" });
        router.push("/dashboard/user");
      } else {
        toast({ title: "Error", description: data.message || "Failed to schedule appointment.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while scheduling the appointment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Get selected clinic's operating hours for the selected date
  const selectedClinic = clinics.find(c => c._id === formData.clinicId);
  let filteredSlots = availableSlots;
  if (selectedClinic && formData.date && selectedClinic.operatingHours) {
    const dayKey = getDayKey(formData.date);
    const hoursStr = selectedClinic.operatingHours[dayKey] || '';
    const range = parseTimeRange(hoursStr);
    if (range) {
      filteredSlots = availableSlots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        return isTimeInRange(slotDate, range.start, range.end);
      });
    } else {
      filteredSlots = [];
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Step content
  const steps = [
    // Step 0: Appointment Type
    <Card key="step-0" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Appointment Type</CardTitle>
        <CardDescription>Choose how you want to consult</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={formData.appointmentType} onValueChange={v => handleChange("appointmentType", v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Video Consultation</SelectItem>
            <SelectItem value="inperson">In Person Visit</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-4 justify-end">
          <Button onClick={handleNext} disabled={!formData.appointmentType}>Next</Button>
        </div>
      </CardContent>
    </Card>,
    // Step 1: Clinic
    <Card key="step-1" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Clinic</CardTitle>
        <CardDescription>Choose a clinic for your appointment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={formData.clinicId} onValueChange={v => handleChange("clinicId", v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select clinic" />
          </SelectTrigger>
          <SelectContent>
            {clinics.map(clinic => (
              <SelectItem key={clinic._id} value={clinic._id}>
                {clinic.clinicName} {clinic.location?.city ? `(${clinic.location.city})` : ""} {clinic.role ? `- ${clinic.role}` : ""} {clinic.userType ? `/ ${clinic.userType}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button onClick={handleNext} disabled={!formData.clinicId}>Next</Button>
        </div>
      </CardContent>
    </Card>,
    // Step 2: Pet
    <Card key="step-2" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Pet</CardTitle>
        <CardDescription>Choose which pet this appointment is for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={formData.petId} onValueChange={v => handleChange("petId", v)} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose your pet" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet) => (
              <SelectItem key={pet._id} value={pet._id}>
                {pet.name} ({pet.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button onClick={handleNext} disabled={!formData.petId}>Next</Button>
        </div>
      </CardContent>
    </Card>,
    // Step 3: Date & Time
    <Card key="step-3" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Date & Time</CardTitle>
        <CardDescription>Pick a date and available time slot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={e => handleChange("date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Select
            value={formData.startTime}
            onValueChange={v => handleTimeSlotSelect(parseInt(v))}
            required
            disabled={!formData.date || filteredSlots.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.date ? "Select a date first" :
                filteredSlots.length === 0 ? "No available slots" :
                formData.startTime ? new Date(parseInt(formData.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                "Select time"
              } />
            </SelectTrigger>
            <SelectContent>
              {filteredSlots.map((slot) => (
                <SelectItem key={slot.startTime} value={slot.startTime.toString()}>
                  {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button onClick={handleNext} disabled={!formData.date || !formData.startTime}>Next</Button>
        </div>
      </CardContent>
    </Card>,
    // Step 4: Consultation Reason
    <Card key="step-4" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Consultation Reason</CardTitle>
        <CardDescription>Tell us the reason for your visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          id="notes"
          placeholder="Any specific concerns or information about your pet..."
          value={formData.notes}
          onChange={e => handleChange("notes", e.target.value)}
          rows={4}
        />
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button onClick={handleNext} disabled={!formData.notes}>Next</Button>
        </div>
      </CardContent>
    </Card>,
    // Step 5: Review & Submit
    <Card key="step-5" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Check your details before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Appointment Type:</strong> {formData.appointmentType === 'video' ? 'Video Consultation' : 'In Person Visit'}<br />
          <strong>Clinic:</strong> {clinics.find(c => c._id === formData.clinicId)?.clinicName}<br />
          <strong>Pet:</strong> {pets.find(p => p._id === formData.petId)?.name}<br />
          <strong>Date:</strong> {formData.date}<br />
          <strong>Time:</strong> {formData.startTime ? new Date(parseInt(formData.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}<br />
          <strong>Reason:</strong> {formData.notes}<br />
        </div>
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Scheduling..." : "Submit"}</Button>
        </div>
      </CardContent>
    </Card>
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard/user" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Appointment</h1>
          <p className="text-gray-600">Book a visit for your pet</p>
        </div>
        {steps[step]}
      </div>
    </div>
  )
}
