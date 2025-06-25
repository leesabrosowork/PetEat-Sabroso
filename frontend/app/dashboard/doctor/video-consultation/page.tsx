"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ArrowLeft,
  Camera,
  Save,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import GoogleMeetDialog from "@/components/GoogleMeetDialog"

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  pet: {
    _id: string;
    name: string;
  };
  clinic?: {
    _id: string;
    clinicName: string;
    email: string;
  };
}

export default function DoctorVideoConsultation() {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [notes, setNotes] = useState("")
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState<string>("")
  const [vetClinicName, setVetClinicName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("doctor")
  const [dashboardPath, setDashboardPath] = useState<string>("/dashboard/doctor")
  const [isInPerson, setIsInPerson] = useState(false)
  const [petName, setPetName] = useState("")
  const [petAge, setPetAge] = useState("")
  const [petSex, setPetSex] = useState("")
  const [petBreed, setPetBreed] = useState("")
  const [petSpecies, setPetSpecies] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [diseaseHistory, setDiseaseHistory] = useState("")
  const [weight, setWeight] = useState("")
  const [temperature, setTemperature] = useState("")
  const [respiratoryRate, setRespiratoryRate] = useState("")
  const [crt, setCrt] = useState("")
  const [skinTenting, setSkinTenting] = useState(false)
  const [proofOfVaccines, setProofOfVaccines] = useState("")
  const [clientEducation, setClientEducation] = useState("")
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetError, setMeetError] = useState<string | null>(null)
  const [googleTokens, setGoogleTokens] = useState<any>(null)
  const [googleAuthSuccess, setGoogleAuthSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Debug dialog state changes
  useEffect(() => {
    console.log('💡 dialogOpen state changed:', dialogOpen);
  }, [dialogOpen])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointment")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check user role for proper dashboard redirection
    const role = localStorage.getItem("role")
    if (role) {
      setUserRole(role)
      
      // Set correct dashboard path based on role
      if (role === "clinic") {
        setDashboardPath("/dashboard/vet-clinic")
      } else if (role === "doctor") {
        setDashboardPath("/dashboard/doctor")
      }
    }



    // Fetch real appointment data from backend
    if (appointmentId) {
      const fetchAppointmentData = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:8080/api/bookings/${appointmentId}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.data) {
              // Set appointment data
              setAppointment(data.data);
              
              // Extract additional info
              setDoctorName(data.data.doctor?.name || "Dr. Williams");
              setVetClinicName(data.data.clinic?.clinicName || "Happy Paws Veterinary Clinic");
              
              // Set Meet link if it exists
              if (data.data.googleMeetLink) {
                setMeetLink(data.data.googleMeetLink);
              }
            } else {
              setError('Appointment not found');
            }
          } else {
            setError('Failed to fetch appointment');
          }
        } catch (error) {
          console.error('Error fetching appointment:', error);
          setError('Failed to load appointment data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchAppointmentData();
    } else {
      // No appointment ID provided - redirect based on user role
      const role = localStorage.getItem("role");
      if (role === "clinic") {
        // Clinic users should use the vet clinic dashboard
        window.location.href = '/dashboard/vet-clinic';
      } else {
        // Other users can go to vet clinic for now (until doctor dashboard exists)
        setError('No appointment selected. Please access video consultations through your dashboard.');
        setLoading(false);
      }
    }
  }, [appointmentId, searchParams, toast]);

  useEffect(() => {
    // Start user's camera
    if (isVideoOn && localVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            localStreamRef.current = stream
          }
        })
        .catch((err) => console.log("Error accessing camera:", err))
    }
  }, [isVideoOn])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startCall = async () => {
    setIsCallActive(true)
    setCallDuration(0)
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallDuration(0)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    router.push(dashboardPath)
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
      }
    }
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn
      }
    }
  }

  const saveNotes = async () => {
    const clinicalNote = {
      consultation: appointment?._id,
      pet: appointment?.pet._id,
      petName,
      petAge,
      petSex,
      petBreed,
      petSpecies,
      medicalHistory,
      diseaseHistory,
      clientEducation,
      vitals: isInPerson ? { weight, temperature, respiratoryRate } : undefined,
      crt: isInPerson ? crt : undefined,
      skinTenting: isInPerson ? skinTenting : undefined,
      proofOfVaccines: isInPerson ? proofOfVaccines : undefined,
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:8080/api/clinical-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clinicalNote),
      })
      if (!res.ok) throw new Error("Failed to save clinical note")
      toast({ title: "Success", description: "Clinical note saved successfully!", variant: "default" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save clinical note", variant: "destructive" })
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-blue-600 mb-4 text-4xl">🩺</div>
          <h2 className="text-xl font-semibold mb-2">Video Consultation</h2>
          <p className="text-gray-600 mb-6">{error || 'No appointment selected'}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/vet-clinic')} className="w-full">
              Go to Vet Clinic Dashboard
            </Button>
            <p className="text-sm text-gray-500">
              Access video consultations through the "Video Consultations" tab, then click "View Details" on an appointment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Link href={dashboardPath} className="flex items-center gap-2 text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Google Meet Integration */}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-start md:items-center">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Create Meet Link clicked! Current dialogOpen:', dialogOpen);
              console.log('Setting dialogOpen to true...');
              setDialogOpen(true);
              console.log('After setDialogOpen, new state should be true');
            }}
            variant="default"
            disabled={!appointment}
            type="button"
          >
            Create Meet Link
          </Button>
          
          {meetLink && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-green-600">🎥</span>
              <a href={meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all hover:text-blue-800">
                Join Google Meet
              </a>
              <span className="text-xs text-gray-500">(Link ready!)</span>
            </div>
          )}
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-md mb-6">
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Video Consultation for {appointment.pet.name}</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">with {appointment.user.name}</p>
              </div>
              <div className="flex items-center gap-4">
                {isCallActive && (
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    {formatDuration(callDuration)}
                  </Badge>
                )}
                <Badge variant={isCallActive ? "default" : "secondary"}>
                  {isCallActive ? "Connected" : "Waiting"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-gray-50 dark:bg-gray-900">
            {/* Participant Information */}
            <div className="mb-6 flex flex-wrap gap-4 justify-center">
              <Badge variant="outline" className="px-4 py-2 text-base bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Pet Owner: {appointment.user.name}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                Veterinarian: Dr. {doctorName || "You"}
              </Badge>
              {vetClinicName && (
                <Badge variant="outline" className="px-4 py-2 text-base bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  Clinic: {vetClinicName}
                </Badge>
              )}
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Doctor Video */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
                {isVideoOn ? (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{doctorName ? doctorName[0] : "D"}</span>
                      </div>
                      <p className="text-white">Camera Off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Veterinarian: Dr. {doctorName || "You"}
                </div>
              </div>

              {/* Pet Owner Video (Simulated) */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
                {isCallActive ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold">{appointment.user.name[0]}</span>
                      </div>
                      <p className="text-lg">{appointment.user.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-gray-400">
                      <Camera className="h-16 w-16 mx-auto mb-2" />
                      <p>Waiting for pet owner to join...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Pet Owner: {appointment.user.name}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant={isAudioOn ? "default" : "destructive"}
                size="lg"
                className="rounded-full h-16 w-16 flex items-center justify-center"
                onClick={toggleAudio}
              >
                {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="lg"
                className="rounded-full h-16 w-16 flex items-center justify-center"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              {!isCallActive ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full h-16 w-16 flex items-center justify-center"
                  onClick={startCall}
                >
                  <Video className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full h-16 w-16 flex items-center justify-center"
                  onClick={endCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctor's Notes Section - replaced with structured form */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg text-gray-900 dark:text-white">Clinical Note</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gray-50 dark:bg-gray-900">
            <form className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="inPerson">In-person consultation?</Label>
                <input id="inPerson" type="checkbox" checked={isInPerson} onChange={e => setIsInPerson(e.target.checked)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pet Name</Label>
                  <Input value={petName} onChange={e => setPetName(e.target.value)} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={petAge} onChange={e => setPetAge(e.target.value)} />
                </div>
                <div>
                  <Label>Sex</Label>
                  <Input value={petSex} onChange={e => setPetSex(e.target.value)} />
                </div>
                <div>
                  <Label>Breed</Label>
                  <Input value={petBreed} onChange={e => setPetBreed(e.target.value)} />
                </div>
                <div>
                  <Label>Species</Label>
                  <Input value={petSpecies} onChange={e => setPetSpecies(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Medical History</Label>
                <Textarea value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} placeholder="Summarize medical history..." />
              </div>
              <div>
                <Label>Disease History</Label>
                <Textarea value={diseaseHistory} onChange={e => setDiseaseHistory(e.target.value)} placeholder="Summarize disease history..." />
              </div>
              {isInPerson && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                    <div>
                      <Label>Temperature (°C)</Label>
                      <Input type="number" value={temperature} onChange={e => setTemperature(e.target.value)} />
                    </div>
                    <div>
                      <Label>Respiratory Rate</Label>
                      <Input type="number" value={respiratoryRate} onChange={e => setRespiratoryRate(e.target.value)} />
                    </div>
                    <div>
                      <Label>CRT (sec)</Label>
                      <Input type="number" value={crt} onChange={e => setCrt(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Skin Tenting</Label>
                      <input type="checkbox" checked={skinTenting} onChange={e => setSkinTenting(e.target.checked)} />
                    </div>
                    <div>
                      <Label>Proof of Vaccines</Label>
                      <Input value={proofOfVaccines} onChange={e => setProofOfVaccines(e.target.value)} placeholder="Enter proof or file ref..." />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label>Client Education (Notes to client)</Label>
                <Textarea value={clientEducation} onChange={e => setClientEducation(e.target.value)} placeholder="Instructions for client..." />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={saveNotes} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Clinical Note
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Google Meet Dialog */}
        <GoogleMeetDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          appointment={appointment}
          onSuccess={() => {
            // Refresh the appointment data to get the new meet link
            if (appointmentId) {
              const fetchAppointmentData = async () => {
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`http://localhost:8080/api/bookings/${appointmentId}`, {
                    headers: { 
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    if (data && data.data && data.data.googleMeetLink) {
                      setMeetLink(data.data.googleMeetLink);
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing appointment data:', error);
                }
              };
              
              fetchAppointmentData();
            }
          }}
        />

      </div>
    </div>
  )
}
