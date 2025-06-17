"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { 
  Calendar, 
  Heart, 
  Video, 
  FileText, 
  Clock, 
  User, 
  LogOut, 
  Stethoscope, 
  Plus,
  Package,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  healthStatus: 'stable' | 'checkup' | 'critical';
  owner: User;
}

interface MedicalRecord {
  _id: string;
  petId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  sex: string;
  owner: {
    name: string;
    phone: string;
    email: string;
    address: string;
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
}

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  pet: Pet;
  user: User;
  doctor: {
    name: string;
  };
}

interface VideoConsultation {
  _id: string;
  startTime: string;
  status: string;
  pet: Pet;
  user: User;
  doctor: {
    name: string;
  };
}

interface Prescription {
  _id: string;
  pet: Pet;
  user: User;
  medicine: {
    name: string;
  };
  description: string;
  createdAt: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  price: number;
}

interface DashboardData {
  totalPets: number;
  petsByStatus: {
    stable: number;
    checkup: number;
    critical: number;
  };
  totalMedicalRecords: number;
  upcomingAppointments: number;
  completedAppointments: number;
  videoConsultations: number;
  totalPrescriptions: number;
  inventoryItems: number;
  lowStockItems: number;
}

export default function VetClinicDashboard() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const router = useRouter();
  const { socket } = useSocket();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPets: 0,
    petsByStatus: { stable: 0, checkup: 0, critical: 0 },
    totalMedicalRecords: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    videoConsultations: 0,
    totalPrescriptions: 0,
    inventoryItems: 0,
    lowStockItems: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Tab data states
  const [pets, setPets] = useState<Pet[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [videoConsultations, setVideoConsultations] = useState<VideoConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Loading states for tabs
  const [petsLoading, setPetsLoading] = useState(false);
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [videoConsultationsLoading, setVideoConsultationsLoading] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    if (!token || !userData || role !== "vet clinic") {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  // Fetch dashboard overview data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      const res = await fetch("http://localhost:8080/api/vet-clinic/dashboard", {
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

  // Fetch pets data
  const fetchPets = async () => {
    setPetsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPets(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setPetsLoading(false);
    }
  };

  // Fetch medical records
  const fetchMedicalRecords = async () => {
    setMedicalRecordsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/medical-records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMedicalRecords(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
    } finally {
      setMedicalRecordsLoading(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAppointments(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Fetch video consultations
  const fetchVideoConsultations = async () => {
    setVideoConsultationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/video-consultations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVideoConsultations(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching video consultations:", error);
    } finally {
      setVideoConsultationsLoading(false);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/prescriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPrescriptions(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  // Fetch inventory
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInventory(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Load dashboard data on mount
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Handle tab changes to load data
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'pets':
        fetchPets();
        break;
      case 'medical-records':
        fetchMedicalRecords();
        break;
      case 'appointments':
        fetchAppointments();
        break;
      case 'video-consultations':
        fetchVideoConsultations();
        break;
      case 'prescriptions':
        fetchPrescriptions();
        break;
      case 'inventory':
        fetchInventory();
        break;
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  };

  // Get health status color
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checkup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get health status icon
  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'stable':
        return <CheckCircle className="w-4 h-4" />;
      case 'checkup':
        return <ClockIcon className="w-4 h-4" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
              <h1 className="text-xl font-semibold text-gray-900">Vet Clinic Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.clinicName || user?.ownerName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pets Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('pets-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pets</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalPets}</div>
              <div className="flex space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {dashboardData.petsByStatus.stable} Stable
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {dashboardData.petsByStatus.checkup} Checkup
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {dashboardData.petsByStatus.critical} Critical
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medical Records Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('medical-records-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalMedicalRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total records maintained
              </p>
            </CardContent>
          </Card>

          {/* Appointments Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('appointments-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.upcomingAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.completedAppointments} completed today
              </p>
            </CardContent>
          </Card>

          {/* Video Consultations Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('video-consultations-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Video Consultations</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.videoConsultations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled consultations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pets" id="pets-tab">Pets</TabsTrigger>
            <TabsTrigger value="medical-records" id="medical-records-tab">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments" id="appointments-tab">Appointments</TabsTrigger>
            <TabsTrigger value="video-consultations" id="video-consultations-tab">Video Consultations</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">New pet registration</span>
                      <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Appointment completed</span>
                      <span className="text-xs text-gray-500 ml-auto">15 min ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Medical record updated</span>
                      <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Plus className="w-6 h-6 mb-2" />
                      <span className="text-sm">Add Pet</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Calendar className="w-6 h-6 mb-2" />
                      <span className="text-sm">Schedule Appointment</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm">Create EMR</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Package className="w-6 h-6 mb-2" />
                      <span className="text-sm">Manage Inventory</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pets Tab */}
          <TabsContent value="pets">
            <Card>
              <CardHeader>
                <CardTitle>Registered Pets</CardTitle>
                <CardDescription>All pets registered with your clinic</CardDescription>
              </CardHeader>
              <CardContent>
                {petsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading pets...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Name</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Health Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pets.map((pet) => (
                        <TableRow key={pet._id}>
                          <TableCell className="font-medium">{pet.name}</TableCell>
                          <TableCell>{pet.breed}</TableCell>
                          <TableCell>{pet.age} years</TableCell>
                          <TableCell>{pet.owner.name}</TableCell>
                          <TableCell>
                            <Badge className={getHealthStatusColor(pet.healthStatus)}>
                              {getHealthStatusIcon(pet.healthStatus)}
                              <span className="ml-1 capitalize">{pet.healthStatus}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="medical-records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>Electronic Medical Records for all pets</CardDescription>
              </CardHeader>
              <CardContent>
                {medicalRecordsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading medical records...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Name</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Vaccinations</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">{record.name}</TableCell>
                          <TableCell>{record.species}</TableCell>
                          <TableCell>{record.owner.name}</TableCell>
                          <TableCell>
                            {record.visitHistory.length > 0 
                              ? new Date(record.visitHistory[record.visitHistory.length - 1].date).toLocaleDateString()
                              : 'No visits'
                            }
                          </TableCell>
                          <TableCell>{record.vaccinations.length} vaccines</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View EMR
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>All scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading appointments...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment._id}>
                          <TableCell>
                            {new Date(appointment.startTime).toLocaleDateString()} <br />
                            {new Date(appointment.startTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="font-medium">{appointment.pet.name}</TableCell>
                          <TableCell>{appointment.user.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{appointment.type}</Badge>
                          </TableCell>
                          <TableCell>{appointment.doctor.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Consultations Tab */}
          <TabsContent value="video-consultations">
            <Card>
              <CardHeader>
                <CardTitle>Video Consultations</CardTitle>
                <CardDescription>Remote consultation sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {videoConsultationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading video consultations...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videoConsultations.map((consultation) => (
                        <TableRow key={consultation._id}>
                          <TableCell>
                            {new Date(consultation.startTime).toLocaleDateString()} <br />
                            {new Date(consultation.startTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="font-medium">{consultation.pet.name}</TableCell>
                          <TableCell>{consultation.user.name}</TableCell>
                          <TableCell>{consultation.doctor.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {consultation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Join Call
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions</CardTitle>
                <CardDescription>All prescribed medications</CardDescription>
              </CardHeader>
              <CardContent>
                {prescriptionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading prescriptions...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((prescription) => (
                        <TableRow key={prescription._id}>
                          <TableCell>
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{prescription.pet.name}</TableCell>
                          <TableCell>{prescription.user.name}</TableCell>
                          <TableCell>{prescription.medicine.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {prescription.description}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Clinic supplies and medications</CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading inventory...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge className={
                              item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                              item.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>₱{item.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Update Stock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 