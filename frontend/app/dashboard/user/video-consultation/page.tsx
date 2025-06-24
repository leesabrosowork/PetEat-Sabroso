"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, VideoOff, Mic, MicOff, PhoneOff, ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor: {
    _id: string;
    name: string;
    email: string;
    vetClinic?: {
      name: string;
    };
  };
  pet: {
    _id: string;
    name: string;
  };
  googleMeetLink?: string;
}

export default function VideoConsultation() {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [clinicalNote, setClinicalNote] = useState<any>(null)
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const { toast } = useToast()

  const videoRef = useRef<HTMLVideoElement>(null)
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointment")
  const router = useRouter()

  useEffect(() => {
    // Fetch appointment from backend
    if (appointmentId) {
      fetch(`http://localhost:8080/api/bookings/${appointmentId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.data) {
            setAppointment(data.data);
            setMeetLink(data.data.googleMeetLink || null);
          } else {
            setError('Appointment not found');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch appointment');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    // Mock data for testing instead of API calls
    setTimeout(() => {
      setUserName("John Smith")
      setAppointment({
        _id: appointmentId || "mock123",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: "scheduled",
        doctor: {
          _id: "doctor123",
          name: "Dr. Williams",
          email: "dr.williams@petcare.com",
          vetClinic: {
            name: "Happy Paws Veterinary Clinic"
          }
        },
        pet: {
          _id: "pet123",
          name: "Max"
        }
      });
      setLoading(false)
    }, 1500); // Small delay to show loading state
  }, [appointmentId]);

  useEffect(() => {
    // Start user's camera
    if (isVideoOn && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
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

  useEffect(() => {
    if (!appointmentId) return
    // Fetch clinical note after consultation
    fetch(`http://localhost:8080/api/clinical-notes/consultation/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setClinicalNote(data.data[0])
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load clinical note", variant: "destructive" })
      })
  }, [appointmentId])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startCall = () => {
    setIsCallActive(true)
    setCallDuration(0)
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallDuration(0)
    // Clean up video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    router.push("/dashboard/user")
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
      }
    }
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn
      }
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
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Consultation</h2>
          <p className="text-gray-600 mb-4">{error || 'Appointment not found'}</p>
          <Button onClick={() => router.push("/dashboard/user")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Link href="/dashboard/user" className="flex items-center gap-2 text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Video Consultation for {appointment.pet.name}</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">with {appointment.doctor.name}</p>
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
            {/* Google Meet Link */}
            {meetLink && (
              <div className="mb-4 flex flex-col items-center">
                <a href={meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-lg font-semibold mb-2">
                  Join Google Meet
                </a>
                <span className="text-xs text-gray-500 break-all">{meetLink}</span>
              </div>
            )}
            {/* Participant Information */}
            <div className="mb-6 flex flex-wrap gap-4 justify-center">
              <Badge variant="outline" className="px-4 py-2 text-base bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                Pet Owner: {userName || "You"}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                Veterinarian: Dr. {appointment.doctor.name}
              </Badge>
              {appointment.doctor.vetClinic && (
                <Badge variant="outline" className="px-4 py-2 text-base bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  Clinic: {appointment.doctor.vetClinic.name}
                </Badge>
              )}
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* User Video */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
                {isVideoOn ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{userName ? userName[0] : "Y"}</span>
                      </div>
                      <p className="text-white">Camera Off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Pet Owner: {userName || "You"}
                </div>
              </div>

              {/* Doctor Video (Simulated) */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
                {isCallActive ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold">{appointment.doctor.name[0]}</span>
                      </div>
                      <p className="text-lg">{appointment.doctor.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-gray-400">
                      <Camera className="h-16 w-16 mx-auto mb-2" />
                      <p>Waiting for doctor to join...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Veterinarian: Dr. {appointment.doctor.name}
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

        {/* Clinical Note Display */}
        {clinicalNote && (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md mt-6">
            <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-lg text-gray-900 dark:text-white">Clinical Note</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gray-50 dark:bg-gray-900 space-y-2">
              <div><b>Pet Name:</b> {clinicalNote.petName || "-"}</div>
              <div><b>Age:</b> {clinicalNote.petAge || "-"}</div>
              <div><b>Sex:</b> {clinicalNote.petSex || "-"}</div>
              <div><b>Breed:</b> {clinicalNote.petBreed || "-"}</div>
              <div><b>Species:</b> {clinicalNote.petSpecies || "-"}</div>
              <div><b>Medical History:</b> {clinicalNote.medicalHistory || "-"}</div>
              <div><b>Disease History:</b> {clinicalNote.diseaseHistory || "-"}</div>
              {clinicalNote.vitals && (
                <>
                  <div><b>Weight:</b> {clinicalNote.vitals.weight || "-"} kg</div>
                  <div><b>Temperature:</b> {clinicalNote.vitals.temperature || "-"} °C</div>
                  <div><b>Respiratory Rate:</b> {clinicalNote.vitals.respiratoryRate || "-"}</div>
                </>
              )}
              {clinicalNote.crt && <div><b>CRT:</b> {clinicalNote.crt} sec</div>}
              {clinicalNote.skinTenting !== undefined && <div><b>Skin Tenting:</b> {clinicalNote.skinTenting ? "Yes" : "No"}</div>}
              {clinicalNote.proofOfVaccines && <div><b>Proof of Vaccines:</b> {clinicalNote.proofOfVaccines}</div>}
              <div><b>Client Education (Notes to client):</b> {clinicalNote.clientEducation || "-"}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
