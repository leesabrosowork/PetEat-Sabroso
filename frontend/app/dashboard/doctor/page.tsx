"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, Heart, Video, FileText, Clock, User, LogOut, Stethoscope, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EMRViewer } from "@/components/EMRViewer"
import EMRForm from "@/components/EMRForm"
import type { Pet, EMRFormData } from "@/components/EMRForm"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  contactNumber: string;
  type?: string;
  gender?: string;
  availability?: 'available' | 'not available' | 'busy';
}

interface Appointment {
  _id: string;
  startTime: string;
  type: string;
  status: string;
  pet: Pet;
  user: User;
}

interface Prescription {
  _id: string;
  pet: Pet;
  user: User;
  medicine: {
    item: string;
  };
  description: string;
  createdAt: string;
}

interface EMR {
  _id: string;
  petId: Pet;
  name: string;
  species: string;
  breed: string;
  age: number;
  sex: string;
  currentVisit: {
    date: string;
    diagnosis: string;
    treatment: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
    followUpDate?: string;
    status: "active" | "ongoing" | "completed";
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
  doctor: User;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
}

export default function DoctorDashboard() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingAppointments: [],
    pastAppointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
  const [prescriptionsError, setPrescriptionsError] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Pet[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // Sync isAvailable with user.availability on load
  useEffect(() => {
    if (user && typeof user.availability === 'string') {
      setIsAvailable(user.availability === 'available');
    }
  }, [user]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isEMRFormOpen, setIsEMRFormOpen] = useState(false);
  const [isEMRViewerOpen, setIsEMRViewerOpen] = useState(false);
  const [isEMRListOpen, setIsEMRListOpen] = useState(false);
  const [selectedEMR, setSelectedEMR] = useState<EMR | null>(null);
  const [selectedPetForEMRList, setSelectedPetForEMRList] = useState<Pet | null>(null);
  const [emrs, setEmrs] = useState<EMR[]>([]);
  const [emrsLoading, setEmrsLoading] = useState(true);
  const [emrsError, setEmrsError] = useState<string | null>(null);

  const patchOwner = (owner: any) => {
    if (!owner) {
      return {
        _id: "pet-owner-id",
        role: "pet owner",
        name: "",
        email: "",
        contactNumber: ""
      };
    }
    return {
      ...owner,
      _id: owner._id || "pet-owner-id",
      role: owner.role || "pet owner"
    };
  };

  const patchPatients = (patients: Pet[]): Pet[] =>
    patients.map(pet => ({
      ...pet,
      owner: patchOwner(pet.owner)
    }));

  // Memoize the EMR form initial data so it's only recalculated when selectedEMR changes
  const emrFormInitialData = useMemo(() => {
    if (!selectedEMR) return undefined;
    return {
      petId: selectedEMR.petId._id ?? "",
      name: selectedEMR.name ?? "",
      species: selectedEMR.species ?? "",
      breed: selectedEMR.breed ?? "",
      age: selectedEMR.age ?? 0,
      sex: selectedEMR.sex ?? "male",
      vaccinations: selectedEMR.vaccinations,
      medicalHistory: selectedEMR.medicalHistory,
      visitHistory: selectedEMR.visitHistory,
      currentVisit: selectedEMR.currentVisit
    } as EMRFormData;
  }, [selectedEMR]);


  const updateAvailability = async (available: boolean) => {
    if (!user || !user._id) return;
    try {
      const response = await fetch(`http://localhost:8080/api/doctors/${user._id}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ availability: available ? "available" : "not available" })
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      setIsAvailable(available);
      toast({
        title: "Success",
        description: `You are now ${available ? "available" : "busy"} for appointments`
      });
      // Optionally emit socket event to notify admin dashboard
      if (socket) {
        socket.emit("doctor_availability_updated", { doctorId: user._id, availability: available ? "available" : "not available" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive"
      });
    }
  };


  const { socket } = useSocket();

  // --- FETCH FUNCTIONS ---
  const fetchDashboardData = async (userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(`http://localhost:8080/api/doctors/dashboard${userId ? `?userId=${userId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  

  const fetchPatients = async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("http://localhost:8080/api/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      if (data.success) {
        setPatients(patchPatients(data.data));
      } else {
        setPatientsError(data.message);
      }
    } catch (e: any) {
      // Try to extract backend error if available
      if (e.response && typeof e.response.json === 'function') {
        try {
          const backendError = await e.response.json();
          setPatientsError(backendError.message || e.message || "Failed to fetch patients");
        } catch {
          setPatientsError(e.message || "Failed to fetch patients");
        }
      } else {
        setPatientsError(e.message || "Failed to fetch patients");
      }
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchEMRs = async () => {
    setEmrsLoading(true);
    setEmrsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("http://localhost:8080/api/emr", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch EMRs");
      const data = await res.json();
      if (data.success) {
        setEmrs(data.data);
      } else {
        setEmrsError(data.message);
      }
    } catch (e: any) {
      setEmrsError(e.message || "Failed to fetch EMRs");
    } finally {
      setEmrsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    setPrescriptionsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("http://localhost:8080/api/prescriptions/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      const data = await res.json();
      if (data.success) {
        setPrescriptions(data.data);
      } else {
        setPrescriptionsError(data.message);
      }
    } catch (e: any) {
      setPrescriptionsError(e.message || "Failed to fetch prescriptions");
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  // --- END FETCH FUNCTIONS ---

  // Define fetchAllDashboardData ONCE at the top level
  const fetchAllDashboardData = () => {
    fetchDashboardData(user?._id);
    fetchPrescriptions();
    fetchPatients();
    fetchEMRs();
  };

  // Initial data load
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        fetchAllDashboardData();
      } catch (e) {
        console.error('Error parsing user data:', e)
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
    // eslint-disable-next-line
  }, [router])

  // Real-time updates
  useEffect(() => {
    if (!socket || !user) return;
    const handleRealtimeUpdate = () => {
      fetchAllDashboardData();
    };
    socket.on("pets_updated", handleRealtimeUpdate);
    socket.on("appointments_updated", handleRealtimeUpdate);
    socket.on("prescriptions_updated", handleRealtimeUpdate);
    socket.on("users_updated", handleRealtimeUpdate);
    socket.on("inventory_updated", handleRealtimeUpdate);
    socket.on("emrs_updated", handleRealtimeUpdate);
    return () => {
      socket.off("pets_updated", handleRealtimeUpdate);
      socket.off("appointments_updated", handleRealtimeUpdate);
      socket.off("prescriptions_updated", handleRealtimeUpdate);
      socket.off("users_updated", handleRealtimeUpdate);
      socket.off("inventory_updated", handleRealtimeUpdate);
      socket.off("emrs_updated", handleRealtimeUpdate);
    };
  }, [socket, user]);

  // Manual fallback: detect return from prescription creation and refresh
  useEffect(() => {
    // If the user navigated from the new prescription page, refresh prescriptions and show toast
    if (
      prevPathRef.current === "/dashboard/doctor/prescriptions/new" &&
      pathname === "/dashboard/doctor"
    ) {
      fetchPrescriptions();
      toast({
        title: "Success",
        description: "Prescription created successfully.",
      });
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return <div>Loading...</div>

  // Helper: format date to yyyy-mm-dd
  const todayStr = new Date().toISOString().slice(0, 10);
  const { upcomingAppointments, pastAppointments } = dashboardData;
  const todayAppointments = upcomingAppointments.filter((apt: Appointment) => {
    const date = apt.startTime ? apt.startTime.slice(0, 10) : "";
    return date === todayStr;
  });

  // Calculate prescription count for this week
  const thisWeekPrescriptions = prescriptions.filter((prescription: Prescription) => {
    const prescriptionDate = new Date(prescription.createdAt);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return prescriptionDate >= weekStart;
  });

  const handleCreateEMR = (formData: any) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    // Find the selected pet to get its details
    const selectedPet = patients.find(pet => pet._id === formData.petId);
    if (!selectedPet) {
      throw new Error("Selected pet not found");
    }
    // Destructure currentVisit for backend
    const { currentVisit, vaccinations, medicalHistory, visitHistory } = formData;
    fetch("http://localhost:8080/api/emr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        petId: formData.petId,
        name: selectedPet.name,
        species: selectedPet.type || selectedPet.breed, // Use type as species
        breed: selectedPet.breed,
        age: selectedPet.age,
        sex: selectedPet.gender || 'male',
        vaccinations: vaccinations || [],
        medicalHistory: medicalHistory || [],
        visitHistory: visitHistory || [],
        currentVisit
      })
    })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create medical record");
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          toast({
            title: "Success",
            description: "Medical record created successfully"
          });
          fetchEMRs();
          setIsEMRFormOpen(false);
        } else {
          throw new Error(data.message || "Failed to create medical record");
        }
      })
      .catch(error => {
        console.error("Create EMR error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create medical record";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      });
  };

  // Remove handleUpdateEMR: doctors cannot update EMRs

  // Add handleDeletePrescription: doctors can delete prescriptions
  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!prescriptionId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`http://localhost:8080/api/prescriptions/${prescriptionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Deleted",
          description: "Prescription deleted successfully"
        });
        await fetchPrescriptions();
      } else {
        throw new Error(data.message || "Failed to delete prescription");
      }
    } catch (error) {
      console.error("Delete Prescription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete prescription";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Add handleDeleteEMR: doctors can delete EMRs
  const handleDeleteEMR = async (emrId: string) => {
    if (!emrId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`http://localhost:8080/api/emr/${emrId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Deleted",
          description: "Medical record deleted successfully"
        });
        await fetchEMRs();
      } else {
        throw new Error(data.message || "Failed to delete medical record");
      }
    } catch (error) {
      console.error("Delete EMR error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete medical record";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/peteat-logo.png" alt="PetEat Logo" width={24} height={24} />
            <span className="text-xl font-bold">PetEat</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Doctor Name */}
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm font-medium">{user ? user.name : "Doctor"}</span>
            </div>

            {/* Availability Switch */}
            <div className="flex items-center gap-2">
              <Switch
                checked={isAvailable}
                onCheckedChange={updateAvailability}
                id="availability-switch"
                aria-label="Toggle availability"
              />
              <span className="text-sm">Availability:</span>
              {isAvailable ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Available</Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">Busy</Badge>
              )}
            </div>

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="text-gray-600">Manage your appointments and patients</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="emr">Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Scheduled for today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{thisWeekPrescriptions.length}</div>
                  <p className="text-xs text-muted-foreground">Issued this week</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAppointments.map((appointment: Appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{appointment.pet?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-600">Owner: {appointment.user?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {appointment.type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/doctor/video-consultation?appointment=${appointment._id}`}>
                            <Button size="sm">
                              <Video className="h-4 w-4 mr-2" />
                              Start Call
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/dashboard/doctor/prescriptions/new">
                    <Button className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Issue Prescription
                    </Button>
                  </Link>
                  <Link href="/dashboard/doctor/video-consultation">
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="h-4 w-4 mr-2" />
                      Start Video Call
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Appointments</h2>
            </div>
            <div className="space-y-4">
              {[...upcomingAppointments, ...pastAppointments].map((appointment: Appointment) => (
                <Card key={appointment._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.pet?.name || "Unknown"}</h3>
                        </div>
                        <p className="text-gray-600">Owner: {appointment.user?.name || "Unknown"}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(appointment.startTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>Type: {appointment.type}</span>
                        </div>
                      </div>
                      {appointment.status === "scheduled" && (
                        <div className="flex gap-2">
                          <Link href={`/dashboard/doctor/video-consultation?appointment=${appointment._id}`}>
                            <Button size="sm">
                              <Video className="h-4 w-4 mr-2" />
                              Start Call
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/dashboard/doctor/prescriptions/new?petId=${appointment.pet._id}`)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Prescribe
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Prescriptions</h2>
              <Link href="/dashboard/doctor/prescriptions/new">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  New Prescription
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {prescriptionsLoading ? (
                <p>Loading prescriptions...</p>
              ) : prescriptionsError ? (
                <p className="text-red-500">{prescriptionsError}</p>
              ) : (
                prescriptions.map((prescription) => (
                  <Card key={prescription._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">Pet: {prescription.pet.name}</h3>
                          <p className="text-gray-600">Owner: {prescription.user.name}</p>
                          <p className="text-gray-600">Medicine: {prescription.medicine.item}</p>
                          <p className="text-sm text-gray-500">Date: {new Date(prescription.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" onClick={() => setSelectedPrescription(prescription)}>View Details</Button>
                          <Button variant="destructive" onClick={() => handleDeletePrescription(prescription._id)}>Delete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

           <TabsContent value="patients" className="space-y-6">
            <h2 className="text-2xl font-bold">Patient Records</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patientsLoading ? (
                <p>Loading patients...</p>
              ) : patientsError ? (
                <p className="text-red-500">{patientsError}</p>
              ) : (
                patients.map((pet) => (
                  <Card key={pet._id}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                          {pet.profilePicture ? (
                            <img 
                              src={`http://localhost:8080/${pet.profilePicture}`} 
                              alt={pet.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
                          )}
                        </div>
                        <div>
                          <CardTitle>{pet.name}</CardTitle>
                          <CardDescription>Owner: {pet.owner?.name || "Unknown"}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>Breed: {pet.breed}</p>
                      <p>Age: {pet.age}</p>
                      <div className="mt-4 space-y-4">
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedEMR({
                              _id: "",
                              petId: pet,
                              name: "",
                              species: "",
                              breed: "",
                              age: 0,
                              sex: "",
                              currentVisit: {
                                date: new Date().toISOString().split('T')[0],
                                diagnosis: "",
                                treatment: "",
                                medications: [],
                                status: "active"
                              },
                              vaccinations: [],
                              medicalHistory: [],
                              visitHistory: [],
                              doctor: patchOwner(pet.owner),
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            });
                            setIsEMRFormOpen(true);
                          }}
                        >
                          Add EMR
                        </Button>
                        
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            // Navigate to EMR list for this pet
                            const petEMRs = emrs.filter(emr => emr.petId._id === pet._id);
                            if (petEMRs.length > 0) {
                              setSelectedPetForEMRList(pet);
                              setIsEMRListOpen(true);
                            } else {
                              toast({
                                title: "No Records",
                                description: "No medical records found for this pet",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          View EMR List ({emrs.filter(emr => emr.petId._id === pet._id).length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="emr" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Medical Records</h2>
              <Button onClick={() => {
                setSelectedEMR(null)
                setIsEMRFormOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emrsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : emrs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No medical records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      emrs.map((emr) => (
                        <TableRow key={emr._id}>
                          <TableCell>{emr.name}</TableCell>
                          <TableCell>
                            {emr.currentVisit?.date ? new Date(emr.currentVisit.date).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                emr.currentVisit?.status === "active"
                                  ? "default"
                                  : emr.currentVisit?.status === "ongoing"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {emr.currentVisit?.status || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {emr.currentVisit?.diagnosis || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEMR(emr)
                                  setIsEMRViewerOpen(true)
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteEMR(emr._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isEMRFormOpen && (
        <Dialog open={isEMRFormOpen} onOpenChange={(open) => {
          setIsEMRFormOpen(open);
          if (!open) setSelectedEMR(null);
        }}>
          <DialogContent className="fixed inset-0 z-50 bg-background p-0 overflow-y-auto flex flex-col max-w-full w-full h-full rounded-none">
            <EMRForm
              isOpen={isEMRFormOpen}
              onClose={() => {
                setIsEMRFormOpen(false);
                setSelectedEMR(null);
              }}
              onSubmit={(data) => { handleCreateEMR(data); }}
              initialData={emrFormInitialData}
              pets={patients as any}
            />
          </DialogContent>
        </Dialog>
      )}


      {isEMRViewerOpen && selectedEMR && (
        <EMRViewer
          emrId={selectedEMR._id}
          isOpen={isEMRViewerOpen}
          onClose={() => {
            setIsEMRViewerOpen(false)
            setSelectedEMR(null)
          }}
          isDoctor={true}
          handleDeleteEMR={handleDeleteEMR}
        />
      )}

      {isEMRListOpen && selectedPetForEMRList && (
        <Dialog open={isEMRListOpen} onOpenChange={setIsEMRListOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Medical Records for {selectedPetForEMRList.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {emrs
                .filter(emr => emr.petId._id === selectedPetForEMRList._id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(emr => (
                  <Card key={emr._id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {emr.currentVisit?.date ? new Date(emr.currentVisit.date).toLocaleDateString() : "N/A"}
                        </CardTitle>
                        <Badge
                          variant={
                            emr.currentVisit?.status === "active"
                              ? "default"
                              : emr.currentVisit?.status === "ongoing"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {emr.currentVisit?.status || "N/A"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Diagnosis:</strong> {emr.currentVisit?.diagnosis || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Treatment:</strong> {emr.currentVisit?.treatment || "N/A"}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEMR(emr);
                            setIsEMRViewerOpen(true);
                            setIsEMRListOpen(false);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEMR(emr._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Prescription Details</h2>
            <p><strong>Pet:</strong> {selectedPrescription.pet.name}</p>
            <p><strong>Owner:</strong> {selectedPrescription.user.name}</p>
            <p><strong>Medicine:</strong> {selectedPrescription.medicine.item}</p>
            <p><strong>Description:</strong> {selectedPrescription.description}</p>
            <p><strong>Date:</strong> {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
            <Button className="mt-4" onClick={() => setSelectedPrescription(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}