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

interface TimeSlot {
  startTime: number;
  endTime: number;
}

export default function ScheduleAppointment() {
  const [pets, setPets] = useState<Pet[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState({
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
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const petsData = await petsResponse.json()
        if (petsData.success) {
          setPets(petsData.data)
        }

        // Fetch all doctors
        const doctorsResponse = await fetch('http://localhost:8080/api/appointments/doctors', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const doctorsData = await doctorsResponse.json()
        if (doctorsData.success) {
          setDoctors(doctorsData.data)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast({
          title: "Error",
          description: "Failed to load initial data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [router, toast])

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.doctorId || !formData.date) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `http://localhost:8080/api/appointments/available-slots?doctorId=${formData.doctorId}&date=${formData.date}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        const data = await response.json()
        if (data.success) {
          setAvailableSlots(data.data)
        }
      } catch (error) {
        console.error('Error fetching available slots:', error)
        toast({
          title: "Error",
          description: "Failed to load available time slots.",
          variant: "destructive",
        })
      }
    }

    fetchAvailableSlots()
  }, [formData.doctorId, formData.date, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const requestData = {
        petId: formData.petId,
        doctorId: formData.doctorId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        notes: formData.notes
      };
      
      console.log('Sending appointment data:', requestData);

      const response = await fetch('http://localhost:8080/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      console.log('Server response:', data);

      if (data.success) {
        toast({
          title: "Success",
          description: "Appointment scheduled successfully!",
        })
        router.push("/dashboard/user")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to schedule appointment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error)
      toast({
        title: "Error",
        description: "An error occurred while scheduling the appointment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const availableDoctors = doctors.filter(doctor => doctor.availability === 'available')

  if (availableDoctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/dashboard/user" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">No Doctors Available</h2>
              <p className="text-gray-600 mb-4">
                We apologize, but there are currently no doctors available for appointments.
                Please try again later.
              </p>
              <Link href="/dashboard/user">
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              New Appointment
            </CardTitle>
            <CardDescription>Fill out the form below to schedule an appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pet">Select Pet</Label>
                  <Select value={formData.petId} onValueChange={(value) => handleChange("petId", value)} required>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Select Doctor</Label>
                  <Select 
                    value={formData.doctorId} 
                    onValueChange={(value) => handleChange("doctorId", value)} 
                    required
                    disabled={availableDoctors.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableDoctors.length === 0 
                          ? "No doctors available at the moment" 
                          : "Choose a doctor"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.name} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableDoctors.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      All doctors are currently unavailable. Please try again later.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select 
                    value={formData.startTime} 
                    onValueChange={(value) => handleTimeSlotSelect(parseInt(value))} 
                    required
                    disabled={!formData.date || !formData.doctorId || availableSlots.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.date ? "Select a date first" :
                        !formData.doctorId ? "Select a doctor first" :
                        availableSlots.length === 0 ? "No available slots" :
                        formData.startTime ? new Date(parseInt(formData.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        "Select time"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot.startTime} value={slot.startTime.toString()}>
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">General Checkup</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific concerns or information about your pet..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Appointment"}
                </Button>
                <Link href="/dashboard/user">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
