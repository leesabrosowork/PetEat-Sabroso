"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { Sun, Moon } from "lucide-react"
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
import { PetDetailsDialog } from "@/components/PetDetailsDialog"
import { InventoryDialog } from "@/components/InventoryDialog"
import { MedicalRecordDialog } from "@/components/MedicalRecordDialog"
import { PrescriptionDetailsDialog } from "@/components/PrescriptionDetailsDialog"
import { AddPetDialog } from "@/components/AddPetDialog"
import { AddInventoryDialog } from "@/components/AddInventoryDialog"
import { AddPrescriptionDialog } from "@/components/AddPrescriptionDialog"
import { BackendStatus } from "@/components/BackendStatus"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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
  profilePicture?: string;
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
  notes?: string;
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
    item: string;
  };
  description: string;
  createdAt: string;
}

interface InventoryItem {
  _id: string;
  item: string;
  stock: number;
  minStock: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

interface Activity {
  _id: string;
  type: string;
  description: string;
  user?: { name: string };
  doctor?: { name: string };
  pet?: { name: string };
  createdAt: string;
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

function VetClinicDashboard() {
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

  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Dialog states
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [medicalRecordDialogOpen, setMedicalRecordDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [addPetDialogOpen, setAddPetDialogOpen] = useState(false);
  const [addInventoryDialogOpen, setAddInventoryDialogOpen] = useState(false);
  const [addPrescriptionDialogOpen, setAddPrescriptionDialogOpen] = useState(false);
  const [users, setUsers] = useState<{ _id: string; name: string; }[]>([]);
  const [medicines, setMedicines] = useState<{ _id: string; item: string; }[]>([]);

  // Add state for selected appointment and dialog open
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Set initial dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedMode);
      document.documentElement.classList.toggle('dark', savedMode);
    }
  }, []);

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
          // Filter to only in-person appointments (not consultations)
          const allAppointments = data.data;
          const inPersonAppointments = allAppointments.filter((a: Appointment) => a.type !== 'consultation');
          setAppointments(inPersonAppointments);
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
      const res = await fetch("http://localhost:8080/api/vet-clinic/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Filter to only consultation type appointments
          const allAppointments = data.data;
          const consultationAppointments = allAppointments.filter(
            (appointment: Appointment) => appointment.type === 'consultation'
          );
          setVideoConsultations(consultationAppointments);
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

  const fetchActivityFeed = async () => {
    setActivityLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/vet-clinic/activity-feed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setActivityFeed(data.data);
      }
    } catch (error) {
      // Optionally handle error
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const res = await fetch("http://localhost:8080/api/vet-clinic/inventory", {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch inventory');
      }
      
      const data = await res.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch inventory",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/vet-clinic/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Prescription deleted successfully",
        });
        handleRefreshData();
      } else {
        throw new Error('Failed to delete prescription');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    }
  };

  // Load dashboard data on mount
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchActivityFeed();
      fetchUsers();
      fetchMedicines();
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

  // Dialog handlers
  const handleViewPetDetails = (pet: Pet) => {
    setSelectedPet(pet);
    setPetDialogOpen(true);
  };

  const handleUpdateInventory = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setInventoryDialogOpen(true);
  };

  const handleViewMedicalRecord = (record: MedicalRecord) => {
    setSelectedMedicalRecord(record);
    setMedicalRecordDialogOpen(true);
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    toast({
      title: "Appointment Details",
      description: `Appointment for ${appointment.pet?.name || 'N/A'} on ${new Date(appointment.startTime).toLocaleDateString()}`,
    });
  };

  // This function has been replaced with inline code in the button

  const handleRefreshData = () => {
    fetchDashboardData();
    fetchActivityFeed();
    // Refresh current tab data
    const currentTab = document.querySelector('[data-state="active"]')?.getAttribute('data-value');
    if (currentTab) {
      handleTabChange(currentTab);
    }
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

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('pet:added', (newPet) => {
        setPets(prevPets => [newPet, ...prevPets]);
        fetchDashboardData(); // Refresh dashboard stats
        toast({
          title: "New Pet Added",
          description: `${newPet.name} has been added to the system`,
        });
      });

      socket.on('inventory:added', (newItem) => {
        setInventory(prevInventory => [newItem, ...prevInventory]);
        fetchDashboardData(); // Refresh dashboard stats
        toast({
          title: "New Inventory Item Added",
          description: `${newItem.item} has been added to inventory`,
        });
      });

      return () => {
        socket.off('pet:added');
        socket.off('inventory:added');
      };
    }
  }, [socket]);

  // Add or subtract stock
  const handleChangeStock = async (id: string, amount: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/vet-clinic/inventory/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: `Stock ${amount > 0 ? "increased" : "decreased"} successfully`,
        })
        fetchInventory() // Refresh inventory data
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    }
  }

  // Delete inventory item
  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/vet-clinic/inventory/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory item deleted successfully",
        })
        fetchInventory() // Refresh inventory data
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    }
  }

  // Add useEffect to fetch appointments on mount
  useEffect(() => { fetchAppointments(); }, []);

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
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image 
                src="/peteat-logo.png" 
                alt="PetEat Logo" 
                width={32} 
                height={32} 
                className="dark:invert-0"
              />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Vet Clinic Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="ml-2"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium dark:text-gray-200">{user?.name || 'User'}</span>
                </div>
                <BackendStatus />
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
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
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Pets</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Medical Records</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.upcomingAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending & scheduled in-person visits
              </p>
            </CardContent>
          </Card>

          {/* Video Consultations Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('video-consultations-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Video Consultations</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.videoConsultations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending & scheduled video consultations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="dark:text-white">Overview</TabsTrigger>
            <TabsTrigger value="pets" id="pets-tab" className="dark:text-white">Pets</TabsTrigger>
            <TabsTrigger value="medical-records" id="medical-records-tab" className="dark:text-white">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments" id="appointments-tab" className="dark:text-white">Appointments</TabsTrigger>
            <TabsTrigger value="video-consultations" id="video-consultations-tab" className="dark:text-white">Video Consultations</TabsTrigger>
            <TabsTrigger value="prescriptions" className="dark:text-white">Prescriptions</TabsTrigger>
            <TabsTrigger value="inventory" className="dark:text-white">Inventory</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading activity...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityFeed.length === 0 ? (
                        <p className="text-gray-500">No recent activity.</p>
                      ) : (
                        activityFeed.map((activity) => (
                          <div key={activity._id} className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full "
                              style={{ backgroundColor: activity.type === 'appointment' ? '#3b82f6' : activity.type === 'registration' ? '#10b981' : activity.type === 'inventory' ? '#f59e42' : '#fbbf24' }}
                            ></div>
                            <span className="text-sm">{activity.description}</span>
                            <span className="text-xs text-gray-500 ml-auto">{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* You can add another card here if needed */}
            </div>
          </TabsContent>

          {/* Pets Tab */}
          <TabsContent value="pets">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Pets Overview</CardTitle>
                    <CardDescription>All pets registered with your clinic</CardDescription>
                  </div>
                  <Button onClick={() => setAddPetDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pet
                  </Button>
                </div>
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
                        <TableHead className="text-gray-900 dark:text-white">Picture</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Breed</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Age</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Health Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pets.map((pet) => (
                        <TableRow key={pet._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {pet.profilePicture ? (
                              <img 
                                src={`http://localhost:8080/${pet.profilePicture}`} 
                                alt={pet.name} 
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No Image</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{pet.name}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{pet.breed}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{pet.age} years</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{pet.owner?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getHealthStatusColor(pet.healthStatus)}>
                              {getHealthStatusIcon(pet.healthStatus)}
                              <span className="ml-1 capitalize">{pet.healthStatus}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewPetDetails(pet)}>
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
                <CardTitle className="text-gray-900 dark:text-white">Medical Records</CardTitle>
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
                        <TableHead className="text-gray-900 dark:text-white">Pet Name</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Species</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Last Visit</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Vaccinations</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords.map((record) => (
                        <TableRow key={record._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell className="font-medium text-gray-900 dark:text-white">{record.name}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{record.species}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{record.owner?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {record.visitHistory.length > 0 
                              ? new Date(record.visitHistory[record.visitHistory.length - 1].date).toLocaleDateString()
                              : 'No visits'
                            }
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{record.vaccinations.length} vaccines</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleViewMedicalRecord(record)}>
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
                <CardTitle className="text-gray-900 dark:text-white">In-Person Appointments</CardTitle>
                <CardDescription>All appointments (pending and scheduled)</CardDescription>
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
                        <TableHead className="text-gray-900 dark:text-white">Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {new Date(appointment.startTime).toLocaleDateString()} <br />
                            {new Date(appointment.startTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{appointment.pet?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{appointment.user?.name || 'N/A'}</TableCell>
                          <TableCell><span className="text-gray-900 dark:text-white">{appointment.notes || 'No reason provided'}</span></TableCell>
                          <TableCell>
                            <Badge className={
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {appointment.status === 'pending' ? 'Pending' : appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {appointment.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button variant="default" size="sm" onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/vet-clinic/appointments/${appointment._id}/approve`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  // Refresh all appointment data
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/vet-clinic/appointments/${appointment._id}/reject`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  // Refresh all appointment data
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Reject</Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(appointment); setDetailsOpen(true); }}>
                                View Details
                              </Button>
                            )}
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
                <CardTitle className="text-gray-900 dark:text-white">Video Consultations</CardTitle>
                <CardDescription>All video consultations (pending and scheduled)</CardDescription>
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
                        <TableRow key={consultation._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {new Date(consultation.startTime).toLocaleDateString()} <br />
                            {new Date(consultation.startTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{consultation.pet?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{consultation.user?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{consultation.doctor?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={
                              consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              consultation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {consultation.status === 'pending' ? 'Pending' : consultation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {consultation.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button variant="default" size="sm" onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/vet-clinic/appointments/${consultation._id}/approve`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  // Refresh all appointment data
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/vet-clinic/appointments/${consultation._id}/reject`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  // Refresh all appointment data
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Reject</Button>
                              </div>
                            ) : consultation.status === 'scheduled' ? (
                              <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/doctor/video-consultation?appointment=${consultation._id}`}>
                                Join Call
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/doctor/video-consultation?appointment=${consultation._id}`}>
                                View Details
                              </Button>
                            )}
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Prescriptions</CardTitle>
                    <CardDescription>All prescribed medications</CardDescription>
                  </div>
                  <Button onClick={() => setAddPrescriptionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prescription
                  </Button>
                </div>
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
                        <TableHead className="text-gray-900 dark:text-white">Date</TableHead>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Medicine</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((prescription) => (
                        <TableRow key={prescription._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">{prescription.pet?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{prescription.user?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{prescription.medicine?.item || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate text-gray-900 dark:text-white">
                            {prescription.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewPrescription(prescription)}>
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeletePrescription(prescription._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Inventory Management</CardTitle>
                    <CardDescription>Clinic supplies and medications</CardDescription>
                  </div>
                  <Button onClick={() => setAddInventoryDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
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
                        <TableHead className="text-gray-900 dark:text-white">Item Name</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Category</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Quantity</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Min Stock</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => (
                        <TableRow key={item._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell className="font-medium text-blue-600 dark:text-blue-400">{item.item}</TableCell>
                          <TableCell className="text-blue-600 dark:text-blue-400">{item.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleChangeStock(item._id, -1)}
                                disabled={item.stock <= 0}
                                aria-label="Decrease stock"
                              >
                                −
                              </Button>
                              <span className="w-8 text-center">{item.stock}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleChangeStock(item._id, 1)}
                                aria-label="Increase stock"
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                              item.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{item.minStock}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleUpdateInventory(item)}>
                                Update Stock
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteInventoryItem(item._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
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

      {/* Dialog Components */}
      <PetDetailsDialog
        pet={selectedPet}
        open={petDialogOpen}
        onOpenChange={setPetDialogOpen}
        onUpdate={handleRefreshData}
      />
      
      <InventoryDialog
        item={selectedInventoryItem}
        open={inventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
        onUpdate={handleRefreshData}
      />
      
      <MedicalRecordDialog
        record={selectedMedicalRecord}
        open={medicalRecordDialogOpen}
        onOpenChange={setMedicalRecordDialogOpen}
      />
      
      <PrescriptionDetailsDialog
        prescription={selectedPrescription}
        open={prescriptionDialogOpen}
        onOpenChange={setPrescriptionDialogOpen}
      />
      
      <AddPetDialog
        open={addPetDialogOpen}
        onOpenChange={setAddPetDialogOpen}
        onAdded={handleRefreshData}
        users={users}
      />
      
      <AddInventoryDialog
        open={addInventoryDialogOpen}
        onOpenChange={setAddInventoryDialogOpen}
        onAdded={handleRefreshData}
      />
      
      <AddPrescriptionDialog
        open={addPrescriptionDialogOpen}
        onOpenChange={setAddPrescriptionDialogOpen}
        onAdded={handleRefreshData}
        pets={pets}
        users={users}
        medicines={medicines}
      />

      {/* Dialog for appointment details */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <div className="space-y-2">
                  <div><strong>Date:</strong> {new Date(selectedAppointment.startTime).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {new Date(selectedAppointment.startTime).toLocaleTimeString()}</div>
                  <div><strong>Pet:</strong> {selectedAppointment.pet?.name || 'N/A'}</div>
                  <div><strong>Owner:</strong> {selectedAppointment.user?.name || 'N/A'}</div>
                  <div><strong>Reason:</strong> {selectedAppointment.notes || 'No reason provided'}</div>
                  <div><strong>Status:</strong> {selectedAppointment.status}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VetClinicDashboard;