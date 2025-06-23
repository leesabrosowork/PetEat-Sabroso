"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { useTheme } from "next-themes"
import { Sun, Moon, MessageSquare } from "lucide-react"
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
  Clock as ClockIcon,
  Building2 as Hospital
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
import { AdmitPetDialog } from "@/components/AdmitPetDialog"
import { UpdateTreatmentDialog } from "@/components/UpdateTreatmentDialog"
import { DischargePetDialog } from "@/components/DischargePetDialog"
import { Input } from "@/components/ui/input"
import EMRForm from "@/components/EMRForm"
import { useToast } from "@/components/ui/use-toast"

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  fullName: string;
  contactNumber?: string;
  address?: string;
}

interface Pet {
  _id: string;
  name: string;
  breed: string;
  species?: string;
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

interface PetUnderTreatment {
  _id: string;
  pet: Pet;
  clinic: {
    _id: string;
    name: string;
    address: string;
    contactNumber: string;
    email: string;
  };
  status: 'Critical' | 'Stable' | 'Improving' | 'Recovered';
  room: string;
  admissionDate: string;
  lastUpdated: string;
  clinicalNotes: string;
  diagnosis: string;
  discharged: boolean;
  treatmentHistory: {
    date: string;
    notes: string;
    updatedBy: {
      _id: string;
      name: string;
    };
  }[];
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
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [activeTabValue, setActiveTabValue] = useState('overview');
  const [loading, setLoading] = useState(true);
  const prevPathRef = useRef<string | null>(null);
  const router = useRouter();
  const { socket } = useSocket();
  const { toast } = useToast();
  
  // Chat state
  const [inboxTab, setInboxTab] = useState(false);
  const [petOwners, setPetOwners] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
  
  const [error, setError] = useState<string | null>(null);
  
  // Tab data states
  const [pets, setPets] = useState<Pet[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [videoConsultations, setVideoConsultations] = useState<VideoConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [petsUnderTreatment, setPetsUnderTreatment] = useState<PetUnderTreatment[]>([]);
  
  // Loading states for tabs
  const [petsLoading, setPetsLoading] = useState(false);
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [videoConsultationsLoading, setVideoConsultationsLoading] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [petsUnderTreatmentLoading, setPetsUnderTreatmentLoading] = useState(false);

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
  const [addMedicalRecordDialogOpen, setAddMedicalRecordDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [addPetDialogOpen, setAddPetDialogOpen] = useState(false);
  const [addInventoryDialogOpen, setAddInventoryDialogOpen] = useState(false);
  const [addPrescriptionDialogOpen, setAddPrescriptionDialogOpen] = useState(false);
  const [admitPetDialogOpen, setAdmitPetDialogOpen] = useState(false);
  const [updateTreatmentDialogOpen, setUpdateTreatmentDialogOpen] = useState(false);
  const [dischargePetDialogOpen, setDischargePetDialogOpen] = useState(false);
  const [selectedPetForAdmission, setSelectedPetForAdmission] = useState<Pet | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<PetUnderTreatment | null>(null);
  const [users, setUsers] = useState<{ _id: string; name: string; }[]>([]);
  const [medicines, setMedicines] = useState<{ _id: string; item: string; }[]>([]);

  // Add state for selected appointment and dialog open
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Add chat state
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [filteredPetOwners, setFilteredPetOwners] = useState<any[]>([]);
  const [selectedPetOwner, setSelectedPetOwner] = useState<any | null>(null);

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
      console.log("Fetching pets with token:", token ? "Token exists" : "No token");
      
      const res = await fetch("http://localhost:8080/api/vet-clinic/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Pets API response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Pets API response data:", data);
        
        if (data.success) {
          console.log("Setting pets data:", data.data);
          setPets(data.data);
        } else {
          console.error("API returned success: false", data.message);
        }
      } else {
        console.error("Failed to fetch pets, status:", res.status);
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
      console.log("Fetching medical records...");
      const res = await fetch("http://localhost:8080/api/vet-clinic/medical-records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Medical records API response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Medical records API response:", data);
        if (data.success) {
          console.log(`Setting ${data.data.length} medical records`);
          setMedicalRecords(data.data);
        } else {
          console.error("API returned success: false", data.message);
        }
      } else {
        console.error("Failed to fetch medical records:", res.statusText);
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

  // Fetch pets under treatment
  const fetchPetsUnderTreatment = async () => {
    setPetsUnderTreatmentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/pets-under-treatment/clinic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPetsUnderTreatment(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching pets under treatment:", error);
    } finally {
      setPetsUnderTreatmentLoading(false);
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
      fetchPets(); // Fetch pets on mount
    }
  }, [user]);

  // Handle tab changes to load data
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTabValue(value);
    
    if (value === 'inbox') {
      console.log("Setting inboxTab to true");
      setInboxTab(true);
    }
    
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
      case 'pets-under-treatment':
        fetchPetsUnderTreatment();
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

  // Handle deleting a medical record
  const handleDeleteMedicalRecord = async (recordId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`http://localhost:8080/api/vet-clinic/medical-records/${recordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete medical record");
      }
      
      // Success - refresh the medical records
      toast({
        title: "Success",
        description: "Medical record deleted successfully"
      });
      
      fetchMedicalRecords();
      fetchDashboardData();
    } catch (error) {
      console.error("Delete medical record error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete medical record",
        variant: "destructive"
      });
    }
  };

  // Map pets to the format expected by EMRForm
  const mapPetsForEMRForm = () => {
          return pets.map(pet => ({
       _id: pet._id,
        name: pet.name,
       type: pet.breed || 'Not specified', // Use breed as type since it's missing
       breed: pet.breed,
       age: pet.age,
       gender: pet.gender,
        profilePicture: pet.profilePicture,
        owner: {
         name: pet.owner?.fullName || 'Pet Owner',
         email: pet.owner?.email || 'Not provided',
         contactNumber: pet.owner?.contactNumber || 'Not provided',
         address: pet.owner?.address || 'Not provided'
        }
      }));
  };

  // Handle creating a medical record
  const handleCreateMedicalRecord = async (formData: any) => {
    // Transform the form data into the format expected by the API
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Find the selected pet from the original pets array
      const selectedPet = pets.find(p => p._id === formData.petId);
      
      if (!selectedPet) {
        toast({
          title: "Error",
          description: "Selected pet not found",
          variant: "destructive",
        });
        return;
      }

      // Create the medical record data
      const medicalRecordData = {
        petId: selectedPet._id,
        name: selectedPet.name,
        species: selectedPet.species || 'Not specified',
        breed: selectedPet.breed || 'Not specified',
        age: selectedPet.age || 0,
        sex: selectedPet.gender || 'Not specified',
        owner: {
          name: selectedPet.owner?.fullName || 'Pet Owner',
          phone: selectedPet.owner?.contactNumber || 'Not provided',
          email: selectedPet.owner?.email || 'Not provided',
          address: selectedPet.owner?.address || 'Not provided',
        },
        // ... rest of the code remains the same ...
      };

      // ... rest of the code remains the same ...
    } catch (error) {
      console.error("Error creating medical record:", error);
      toast({
        title: "Error",
        description: "Failed to create medical record",
        variant: "destructive",
      });
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    toast({
      title: "Appointment Details",
      description: `Appointment for ${appointment.pet?.name || 'Pet'} on ${new Date(appointment.startTime).toLocaleDateString()}`,
    });
  };

  // This function has been replaced with inline code in the button

  const handleRefreshData = () => {
    fetchDashboardData();
    fetchActivityFeed();
    fetchPetsUnderTreatment();
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

  // Handle admitting a pet for treatment
  const handleAdmitPet = async (petId: string, data: { room: string, diagnosis: string, clinicalNotes: string }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/pets-under-treatment/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId,
          room: data.room,
          diagnosis: data.diagnosis,
          clinicalNotes: data.clinicalNotes
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet admitted for treatment successfully",
        });
        setAdmitPetDialogOpen(false);
        fetchPetsUnderTreatment(); // Refresh pets under treatment data
        fetchActivityFeed(); // Refresh activity feed
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Failed to admit pet for treatment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to admit pet for treatment",
        variant: "destructive",
      });
    }
  };

  // Handle updating pet treatment status
  const handleUpdateTreatmentStatus = async (treatmentId: string, data: { status: string, clinicalNotes: string, room?: string }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/pets-under-treatment/update/${treatmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Treatment status updated successfully",
        });
        fetchPetsUnderTreatment(); // Refresh pets under treatment data
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Failed to update treatment status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update treatment status",
        variant: "destructive",
      });
    }
  };

  // Handle discharging a pet from treatment
  const handleDischargePet = async (treatmentId: string, dischargeNotes: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/pets-under-treatment/discharge/${treatmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dischargeNotes }),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pet discharged successfully",
        });
        fetchPetsUnderTreatment(); // Refresh pets under treatment data
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Failed to discharge pet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discharge pet",
        variant: "destructive",
      });
    }
  };

  // Add useEffect to fetch appointments and pets under treatment on mount
  useEffect(() => { 
    fetchAppointments();
    fetchPetsUnderTreatment();
  }, []);

  // Fetch pet owners for chat
  useEffect(() => {
    if (!user || !inboxTab) return;
    
    const fetchPetOwners = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/chat/clinics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch pet owners");
        const data = await res.json();
        setPetOwners(data.data.clinics || []);
        setFilteredPetOwners(data.data.clinics || []);
      } catch (e) {
        console.error("Error fetching pet owners:", e);
        toast({
          title: "Error",
          description: "Failed to load pet owners. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/chat/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data.data || []);
      } catch (e) {
        console.error("Error fetching conversations:", e);
      }
    };
    
    fetchPetOwners();
    fetchConversations();
  }, [user, inboxTab]);
  
  // Search pet owners
  useEffect(() => {
    if (!chatSearchQuery) {
      setFilteredPetOwners(petOwners);
      return;
    }
    
    const query = chatSearchQuery.toLowerCase();
    const filtered = petOwners.filter(owner => 
      (owner.fullName && owner.fullName.toLowerCase().includes(query)) || 
      (owner.username && owner.username.toLowerCase().includes(query)) ||
      (owner.email && owner.email.toLowerCase().includes(query))
    );
    
    setFilteredPetOwners(filtered);
  }, [chatSearchQuery, petOwners]);
  
  // Socket.IO event handlers for chat
  useEffect(() => {
    if (!socket || !currentConversation) return;
    
    // Join the conversation room
    socket.emit('join_conversation', currentConversation._id);
    
    // Listen for new messages
    const handleReceiveMessage = (data: any) => {
      if (data.conversationId === currentConversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update conversations list with new message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === data.conversationId 
            ? { 
                ...conv, 
                lastMessageText: data.message.text,
                lastMessageDate: new Date().toISOString(),
                unreadCount: conv.unreadCount + 1
              } 
            : conv
        )
      );
    };
    
    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.conversationId === currentConversation._id) {
        setTypingStatus(`${data.user.fullName || data.user.username} is typing...`);
      }
    };
    
    const handleUserStopTyping = (data: any) => {
      if (data.conversationId === currentConversation._id) {
        setTypingStatus("");
      }
    };
    
    // Listen for read receipts
    const handleMessagesRead = (data: any) => {
      if (data.conversationId === currentConversation._id) {
        // Update read status of messages
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            read: true
          }))
        );
      }
    };
    
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    
    return () => {
      // Leave the conversation room when component unmounts or conversation changes
      socket.emit('leave_conversation', currentConversation._id);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, currentConversation]);
  
  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!currentConversation) return;
    
    const fetchMessages = async () => {
      setIsLoadingChat(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/api/chat/conversations/${currentConversation._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.data || []);
      } catch (e) {
        console.error("Error fetching messages:", e);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingChat(false);
      }
    };
    
    fetchMessages();
    
    // Mark messages as read via Socket.IO
    if (socket && currentConversation.unreadCount > 0 && user && user._id) {
      socket.emit('mark_read', {
        conversationId: currentConversation._id,
        userId: user._id
      });
    }
  }, [currentConversation, socket, user]);
  
  // Handle selecting a pet owner for chat
  const handleSelectPetOwner = async (owner: any) => {
    setSelectedPetOwner(owner);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ownerId: owner._id })
      });
      
      if (!res.ok) throw new Error("Failed to start conversation");
      
      const data = await res.json();
      setCurrentConversation(data.data);
      
      // Add conversation to list if it's not already there
      const conversationExists = conversations.some(conv => conv._id === data.data._id);
      if (!conversationExists) {
        setConversations([data.data, ...conversations]);
      }
    } catch (e) {
      console.error("Error starting conversation:", e);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    }
  };
  
  // Send message function
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation || !user || !user._id) return;
    
    const messageText = messageInput.trim();
    setMessageInput("");
    
    const optimisticId = Date.now().toString();
    
    // Optimistically add message to UI
    const optimisticMessage = {
      _id: optimisticId,
      sender: {
        _id: user._id,
        fullName: user.fullName || user.clinicName,
        email: user.email,
        role: "vet clinic"
      },
      text: messageText,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    // Log for debugging
    console.log("Sending message:", {
      conversationId: currentConversation._id,
      userId: user._id,
      userRole: "vet clinic",
      messageText: messageText.substring(0, 20) + "..."
    });
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/chat/conversations/${currentConversation._id}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text: messageText })
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      const data = await res.json();
      
      // Log the response data
      console.log("Message response:", data.data);
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticId ? data.data : msg
        )
      );
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === currentConversation._id 
            ? { 
                ...conv, 
                lastMessageText: messageText,
                lastMessageDate: new Date().toISOString()
              } 
            : conv
        )
      );
      
      // Emit message to socket
      if (socket) {
        socket.emit('send_message', {
          conversationId: currentConversation._id,
          message: data.data
        });
      }
    } catch (e) {
      console.error("Error sending message:", e);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticId));
    }
  };
  
  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (socket && currentConversation && user && user._id) {
      socket.emit('typing', {
        conversationId: currentConversation._id,
        user: {
          _id: user._id,
          fullName: user.fullName || user.clinicName,
        }
      });
      
      // Stop typing after 2 seconds of inactivity
      setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: currentConversation._id,
          user: {
            _id: user._id,
            fullName: user.fullName || user.clinicName,
          }
        });
      }, 2000);
    }
  };
  
  // Handle switching to a conversation from the list
  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    // Find the pet owner that matches this conversation's participant
    const owner = conversation.participant;
    setSelectedPetOwner(owner);
  };

  // Fetch pet owners and conversations when inbox tab is selected
  useEffect(() => {
    if (activeTabValue === 'inbox' && user) {
      const fetchPetOwners = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:8080/api/chat/clinics", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch pet owners");
          const data = await res.json();
          setPetOwners(data.data.clinics || []);
          setFilteredPetOwners(data.data.clinics || []);
        } catch (e) {
          console.error("Error fetching pet owners:", e);
          toast({
            title: "Error",
            description: "Failed to load pet owners. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      const fetchConversations = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:8080/api/chat/conversations", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch conversations");
          const data = await res.json();
          setConversations(data.data || []);
        } catch (e) {
          console.error("Error fetching conversations:", e);
        }
      };
      
      fetchPetOwners();
      fetchConversations();
      setInboxTab(true);
    }
  }, [activeTabValue, user]);

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log("Chat button clicked - direct approach");
                  setActiveTabValue('inbox');
                  setInboxTab(true);
                }}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
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
          
          {/* Pets Under Treatment Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById('pets-under-treatment-tab')?.click()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Pets Under Treatment</CardTitle>
              <Hospital className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{petsUnderTreatment.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in care
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTabValue} defaultValue="overview" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="flex flex-wrap gap-1 w-full">
            <TabsTrigger value="overview" className="dark:text-white flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="pets" id="pets-tab" className="dark:text-white flex-shrink-0">Pets</TabsTrigger>
            <TabsTrigger value="medical-records" id="medical-records-tab" className="dark:text-white flex-shrink-0">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments" id="appointments-tab" className="dark:text-white flex-shrink-0">Appointments</TabsTrigger>
            <TabsTrigger value="video-consultations" id="video-consultations-tab" className="dark:text-white flex-shrink-0">Video Consultations</TabsTrigger>
            <TabsTrigger value="pets-under-treatment" id="pets-under-treatment-tab" className="dark:text-white flex-shrink-0">Pets Under Treatment</TabsTrigger>
            <TabsTrigger value="prescriptions" className="dark:text-white flex-shrink-0">Prescriptions</TabsTrigger>
            <TabsTrigger value="inventory" className="dark:text-white flex-shrink-0">Inventory</TabsTrigger>
            <TabsTrigger value="inbox" id="inbox-tab" className="dark:text-white flex-shrink-0">Inbox</TabsTrigger>
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
                          <TableCell className="text-gray-900 dark:text-white">{pet.owner?.name || 'No owner'}</TableCell>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Medical Records</CardTitle>
                    <CardDescription>Electronic Medical Records for all pets</CardDescription>
                  </div>
                  <Button onClick={() => {
                    fetchPets(); // Fetch pets before opening the dialog
                    setAddMedicalRecordDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medical Record
                  </Button>
                </div>
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
                          <TableCell className="text-gray-900 dark:text-white">{record.owner?.name || 'No owner info'}</TableCell>
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
                          <TableCell className="font-medium text-gray-900 dark:text-white">{appointment.pet?.name || 'Pet'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{appointment.user?.fullName || 'Owner'}</TableCell>
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
                          <TableCell className="font-medium text-gray-900 dark:text-white">{consultation.pet?.name || 'Pet'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{consultation.user?.fullName || 'Owner'}</TableCell>
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

          {/* Pets Under Treatment Tab */}
          <TabsContent value="pets-under-treatment">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Pets Under Treatment</CardTitle>
                    <CardDescription>All pets currently receiving care at your clinic</CardDescription>
                  </div>
                  <Button onClick={() => setAdmitPetDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Admit Pet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {petsUnderTreatmentLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading pets under treatment...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Details</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Admitted</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {petsUnderTreatment.map((treatment) => (
                        <TableRow key={treatment._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{treatment.pet.name}</p>
                              <p className="text-sm text-gray-500">{treatment.pet.breed} • {treatment.pet.age} years</p>
                              <p className="text-sm text-gray-500">
                                Owner: {treatment.pet.owner ? treatment.pet.owner.fullName : 'Pet Owner'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{treatment.room}</TableCell>
                          <TableCell>{new Date(treatment.admissionDate).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-xs truncate text-gray-900 dark:text-white">
                            {treatment.diagnosis || 'No diagnosis provided'}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              treatment.status === 'Critical' ? 'bg-red-100 text-red-800' :
                              treatment.status === 'Stable' ? 'bg-blue-100 text-blue-800' :
                              treatment.status === 'Improving' ? 'bg-green-100 text-green-800' :
                              treatment.status === 'Recovered' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {treatment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(treatment.lastUpdated).toLocaleDateString()}<br />
                            {new Date(treatment.lastUpdated).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-2">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTreatment(treatment);
                                    setUpdateTreatmentDialogOpen(true);
                                  }}
                                >
                                  Update Status
                                </Button>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Contact Owner
                                </Button>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedTreatment(treatment);
                                    setDischargePetDialogOpen(true);
                                  }}
                                >
                                  Discharge
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {petsUnderTreatment.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-gray-500">No pets currently under treatment</p>
                          </TableCell>
                        </TableRow>
                      )}
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
                          <TableCell className="font-medium text-gray-900 dark:text-white">{prescription.pet?.name || 'Pet'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{prescription.user?.fullName || 'Owner'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{prescription.medicine?.item || 'No medication specified'}</TableCell>
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

          {/* Inbox Tab Content */}
          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Inbox</CardTitle>
                    <CardDescription>Chat with pet owners</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sidebar with conversations and search */}
                  <div className="border rounded-lg p-4 h-[600px] flex flex-col">
                    <div className="flex gap-2 mb-4">
                      <Tabs defaultValue="conversations" className="w-full">
                        <TabsList className="flex w-full">
                          <TabsTrigger value="conversations" className="flex-1">Conversations</TabsTrigger>
                          <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
                        </TabsList>
                        <TabsContent value="conversations" className="h-[520px] overflow-y-auto">
                          <h3 className="text-sm font-medium mb-2">Recent Conversations</h3>
                          <ul className="space-y-2">
                            {conversations.length === 0 && <li className="text-muted-foreground">No conversations yet.</li>}
                            {conversations.map(conversation => (
                              <li 
                                key={conversation._id} 
                                className={`p-2 rounded flex justify-between ${
                                  currentConversation && currentConversation._id === conversation._id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-accent cursor-pointer'
                                }`}
                                onClick={() => handleSelectConversation(conversation)}
                              >
                                <div>
                                  <div className="font-medium">{conversation.participant?.fullName || conversation.participant?.username}</div>
                                  <div className="text-xs truncate max-w-[180px]">{conversation.lastMessageText || "No messages yet"}</div>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <div className="bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {conversation.unreadCount}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                        <TabsContent value="search" className="h-[520px]">
                          <div className="mb-4">
                            <Input 
                              placeholder="Search pet owners..." 
                              value={chatSearchQuery}
                              onChange={(e) => setChatSearchQuery(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="h-[480px] overflow-y-auto">
                            <h3 className="text-sm font-medium mb-2">Pet Owners</h3>
                            <ul>
                              {filteredPetOwners.length === 0 && <li className="text-muted-foreground">No pet owners found.</li>}
                              {filteredPetOwners.map((owner) => (
                                <li
                                  key={owner._id}
                                  className={`p-2 rounded cursor-pointer mb-2 ${selectedPetOwner && selectedPetOwner._id === owner._id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                                  onClick={() => handleSelectPetOwner(owner)}
                                >
                                  <div className="font-medium">{owner.fullName || owner.username || "Pet Owner"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {owner.email} 
                                    {owner.contactNumber && ` • ${owner.contactNumber}`}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  {/* Chat window */}
                  <div className="border rounded-lg md:col-span-2 h-[600px] flex flex-col">
                    {selectedPetOwner ? (
                      <>
                        <div className="border-b p-4 bg-background flex items-center">
                          <div className="font-bold text-lg">{selectedPetOwner.fullName || selectedPetOwner.username || "Pet Owner"}</div>
                          <div className="ml-2 text-xs text-muted-foreground">
                            {selectedPetOwner.email}
                            {selectedPetOwner.contactNumber && ` • ${selectedPetOwner.contactNumber}`}
                          </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-background">
                          {isLoadingChat ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <>
                              {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground h-full flex flex-col justify-center">
                                  <p>No messages yet</p>
                                  <p className="text-sm">Send a message to start the conversation</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {messages.map((message) => {
                                    // Fix the isOwnMessage determination logic to correctly identify messages
                                    // sent by the vet clinic (current user)
                                    const isOwnMessage = message?.sender && user && message.sender._id === user._id;
                                    
                                    // Log for debugging
                                    console.log("Message:", {
                                      messageId: message._id,
                                      messageSenderId: message?.sender?._id,
                                      senderRole: message?.sender?.role,
                                      messageText: message?.text?.substring(0, 20) + "...",
                                      userId: user?._id,
                                      userRole: "vet clinic", 
                                      isOwnMessage
                                    });
                                    
                                    // Force correct alignment for optimistic messages without proper sender info
                                    const isForcedOwn = !message.sender && message._id.toString().length > 10;
                                    
                                    return (
                                      <div 
                                        key={message._id} 
                                        className={`flex ${isOwnMessage || isForcedOwn ? 'justify-end' : 'justify-start'}`}
                                      >
                                        <div 
                                          className={`max-w-[70%] p-3 rounded-lg ${
                                            isOwnMessage || isForcedOwn
                                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                                            : 'bg-accent text-accent-foreground rounded-bl-none'
                                          }`}
                                        >
                                          <div className="text-sm">{message.text}</div>
                                          <div className="text-xs opacity-70 text-right mt-1">
                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {(isOwnMessage || isForcedOwn) && (
                                              <span className="ml-1">{message.read ? '✓✓' : '✓'}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {typingStatus && (
                                    <div className="text-xs text-muted-foreground italic">
                                      {typingStatus}
                                    </div>
                                  )}
                                  <div ref={chatEndRef} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="border-t p-3 bg-background">
                          <form 
                            className="flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendMessage();
                            }}
                          >
                            <Input 
                              placeholder="Type a message..." 
                              value={messageInput}
                              onChange={handleInputChange}
                              className="flex-1"
                            />
                            <Button type="submit" disabled={!messageInput.trim()}>
                              Send
                            </Button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center items-center h-full text-center text-muted-foreground">
                        <div>
                          <p>Select a pet owner to start chatting</p>
                          <p className="text-sm mt-2">You can search for pet owners or check your recent conversations</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
      
      {/* Medical Record Dialog */}
      {selectedMedicalRecord && (
        <MedicalRecordDialog
          record={selectedMedicalRecord}
          open={medicalRecordDialogOpen}
          onOpenChange={setMedicalRecordDialogOpen}
          onDelete={handleDeleteMedicalRecord}
        />
      )}

      {/* Add Medical Record Dialog */}
      {addMedicalRecordDialogOpen && (
        <Dialog open={addMedicalRecordDialogOpen} onOpenChange={setAddMedicalRecordDialogOpen}>
          <DialogContent className="fixed inset-0 z-50 bg-background p-0 overflow-y-auto flex flex-col max-w-full w-full h-full rounded-none">
            <EMRForm
              isOpen={addMedicalRecordDialogOpen}
              onClose={() => setAddMedicalRecordDialogOpen(false)}
              onSubmit={(data) => handleCreateMedicalRecord(data)}
              pets={mapPetsForEMRForm()}
            />
          </DialogContent>
        </Dialog>
      )}
      
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
                  <div><strong>Pet:</strong> {selectedAppointment.pet?.name || 'Pet'}</div>
                  <div><strong>Owner:</strong> {selectedAppointment.user?.fullName || 'Owner'}</div>
                  <div><strong>Reason:</strong> {selectedAppointment.notes || 'No reason provided'}</div>
                  <div><strong>Status:</strong> {selectedAppointment.status}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Admit Pet Dialog */}
      <AdmitPetDialog
        open={admitPetDialogOpen}
        onOpenChange={setAdmitPetDialogOpen}
        onAdmit={handleAdmitPet}
        pets={pets}
      />

      {/* Update Treatment Dialog */}
      <UpdateTreatmentDialog
        open={updateTreatmentDialogOpen}
        onOpenChange={setUpdateTreatmentDialogOpen}
        onUpdate={handleUpdateTreatmentStatus}
        treatment={selectedTreatment}
      />

      {/* Discharge Pet Dialog */}
      <DischargePetDialog
        open={dischargePetDialogOpen}
        onOpenChange={setDischargePetDialogOpen}
        onDischarge={handleDischargePet}
        treatment={selectedTreatment}
      />
    </div>
  );
}

export default VetClinicDashboard;