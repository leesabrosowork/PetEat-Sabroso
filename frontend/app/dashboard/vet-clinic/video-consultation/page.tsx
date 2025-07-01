"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, PhoneOff, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";

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
    category?: string;
    species?: string;
    breed?: string;
  };
  googleMeetLink?: string;
}

function VideoConsultationContent() {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>("");
  const [dashboardPath] = useState<string>("/dashboard/vet-clinic");
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const router = useRouter();

  useEffect(() => {
    // Set clinic name from localStorage or mock
    const role = localStorage.getItem("role");
    if (role === "clinic") {
      setClinicName(localStorage.getItem("clinicName") || "Your Clinic");
    }
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
    // Start user's camera
    if (isVideoOn && localVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localStreamRef.current = stream;
          }
        })
        .catch((err) => console.log("Error accessing camera:", err));
    }
  }, [isVideoOn]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCall = async () => {
    setIsCallActive(true);
    setCallDuration(0);
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    router.push(dashboardPath);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Consultation</h2>
          <p className="text-gray-600 mb-4">{error || 'Appointment not found'}</p>
          <Button onClick={() => router.push(dashboardPath)}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
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
        <Card>
          <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Video Consultation for {appointment.pet.name}
                  {appointment.pet.category || appointment.pet.breed ? (
                    <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                      {appointment.pet.category}
                      {appointment.pet.breed ? ` • ${appointment.pet.breed}` : ''}
                    </span>
                  ) : null}
                </CardTitle>
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
          <CardContent>
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
                Pet Owner: {appointment.user.name}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                Clinic: {clinicName || "Your Clinic"}
              </Badge>
            </div>
            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Clinic Video */}
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
                      <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{clinicName ? clinicName[0] : "C"}</span>
                      </div>
                      <p className="text-white">Camera Off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Clinic: {clinicName || "Your Clinic"}
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
            <div className="flex gap-6 justify-center mb-6">
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
      </div>
    </div>
  );
}

export default function VetClinicVideoConsultation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoConsultationContent />
    </Suspense>
  );
} 