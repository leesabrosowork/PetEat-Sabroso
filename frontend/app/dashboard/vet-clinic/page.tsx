"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { 
  Calendar, 
  Heart, 
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
  Building2 as Hospital,
  Sun, 
  Moon, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Laptop, 
  FileText, 
  MoreVertical, 
  Search, 
  Video
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { PetDetailsDialog } from "@/components/PetDetailsDialog"
import { InventoryDialog } from "@/components/InventoryDialog"
import { MedicalRecordDialog } from "@/components/MedicalRecordDialog"
import { AddPetDialog } from "@/components/AddPetDialog"
import { AddInventoryDialog } from "@/components/AddInventoryDialog"
import { BackendStatus } from "@/components/BackendStatus"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AdmitPetDialog } from "@/components/AdmitPetDialog"
import { UpdateTreatmentDialog } from "@/components/UpdateTreatmentDialog"
import { DischargePetDialog } from "@/components/DischargePetDialog"
import { Input } from "@/components/ui/input"
import EMRForm from "@/components/EMRForm"
import { useToast } from "@/components/ui/use-toast"
import { EMRViewer } from "@/components/EMRViewer"
import { DashboardSkeleton } from "@/components/DashboardSkeleton"
import { ClientOnly } from "@/components/ClientOnly"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useLocalStorageString, useLocalStorageBoolean } from "@/hooks/useLocalStorage"
import GoogleMeetDialog from "@/components/GoogleMeetDialog"
import DashboardAnalytics from "@/components/DashboardAnalytics"

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  fullName: string;
  contactNumber?: string;
  address?: string;
  clinicName?: string;
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
  category?: string;
  type?: string;
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
  archived?: boolean;
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
  googleMeetLink?: string;
}

interface VideoConsultation {
  _id: string;
  startTime: string;
  endTime: string; // Add the missing endTime property
  status: string;
  pet: Pet;
  user: User;
  doctor: {
    name: string;
  };
  googleMeetLink?: string;
  type: string;
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
  expirationDate?: string;
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
  inventoryItems: number;
  lowStockItems: number;
  weeklyAppointmentsByReason?: Record<string, number>;
  monthlyAppointmentsByReason?: Record<string, number>;
}

// Update Appointment and VideoConsultation interfaces to match booking schema
interface Booking {
  _id: string;
  pet: Pet;
  petOwner: any;
  clinic: any;
  bookingDate: string;
  appointmentTime: string;
  reason: string;
  status: string;
  type: string;
  googleMeetLink?: string;
}

export default function VetClinicDashboard() {
  return (
    <ErrorBoundary>
      <ClientOnly fallback={<DashboardSkeleton />}>
        <VetClinicDashboardContent />
      </ClientOnly>
    </ErrorBoundary>
  );
}

function VetClinicDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const socketContext = useSocket();
  const socket = socketContext.socket;
  
  const [activeTabValue, setActiveTabValue] = useState("overview");
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [videoConsultations, setVideoConsultations] = useState<VideoConsultation[]>([]);
  const [petsUnderTreatment, setPetsUnderTreatment] = useState<PetUnderTreatment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [petsLoading, setPetsLoading] = useState(false);
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [videoConsultationsLoading, setVideoConsultationsLoading] = useState(false);
  const [petsUnderTreatmentLoading, setPetsUnderTreatmentLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  // Dialog states
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isDarkMode, setIsDarkMode] = useLocalStorageBoolean('darkMode', false);
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<MedicalRecord | null>(null);
  const [medicalRecordDialogOpen, setMedicalRecordDialogOpen] = useState(false);
  const [addMedicalRecordDialogOpen, setAddMedicalRecordDialogOpen] = useState(false);
  const [addPetDialogOpen, setAddPetDialogOpen] = useState(false);
  const [addInventoryDialogOpen, setAddInventoryDialogOpen] = useState(false);
  const [admitPetDialogOpen, setAdmitPetDialogOpen] = useState(false);
  const [updateTreatmentDialogOpen, setUpdateTreatmentDialogOpen] = useState(false);
  const [dischargePetDialogOpen, setDischargePetDialogOpen] = useState(false);
  const [selectedPetForAdmission, setSelectedPetForAdmission] = useState<Pet | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<PetUnderTreatment | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  // Add state for selected appointment and dialog open
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Add chat state
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [filteredPetOwners, setFilteredPetOwners] = useState<any[]>([]);
  const [selectedPetOwner, setSelectedPetOwner] = useState<any | null>(null);
  const [petOwners, setPetOwners] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [inboxTab, setInboxTab] = useState("conversations");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Add prescriptions state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Google Meet Dialog state
  const [googleMeetDialogOpen, setGoogleMeetDialogOpen] = useState(false);
  const [selectedAppointmentForMeet, setSelectedAppointmentForMeet] = useState<VideoConsultation | null>(null);

  // Add state for inventory search/filter
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [inventoryExpiration, setInventoryExpiration] = useState('all'); // 'all', 'soon', 'expired'

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Set initial dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    if (!token || !userData || role !== "clinic") {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.name) {
        parsedUser.name = parsedUser.fullName || parsedUser.clinicName || "";
      }
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  // Global error handler for DOM manipulation errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          event.error.message.includes('removeChild') && 
          event.error.message.includes('not a child of this node')) {
        console.warn('DOM manipulation error caught and handled:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          event.reason.message.includes('removeChild')) {
        console.warn('Unhandled promise rejection for DOM manipulation:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Add cleanup for socket connections and async operations
  useEffect(() => {
    let isMounted = true;
    
    // Cleanup function to prevent state updates after unmount
    const cleanup = () => {
      isMounted = false;
    };

    // Override setState functions to check if component is mounted
    const safeSetState = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
      return (value: React.SetStateAction<T>) => {
        if (isMounted) {
          setter(value);
        }
      };
    };

    // Create safe versions of state setters
    const safeSetPets = safeSetState(setPets);
    const safeSetInventory = safeSetState(setInventory);
    const safeSetDashboardData = safeSetState(setDashboardData);
    const safeSetMessages = safeSetState(setMessages);
    const safeSetConversations = safeSetState(setConversations);
    const safeSetTypingStatus = safeSetState(setTypingStatus);

    return cleanup;
  }, []);

  // Fetch dashboard overview data
  const fetchDashboardData = useCallback(async () => {
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
  }, []); // Remove loading dependency to prevent infinite loops

  // Improved socket cleanup
  useEffect(() => {
    if (!socket) return;

    let isMounted = true;

    const handlePetAdded = (newPet: any) => {
      if (!isMounted) return;
      setPets(prevPets => [newPet, ...prevPets]);
      fetchDashboardData();
      toast({
        title: "New Pet Added",
        description: `${newPet.name} has been added to the system`,
      });
    };

    const handleInventoryAdded = (newItem: any) => {
      if (!isMounted) return;
      setInventory(prevInventory => [newItem, ...prevInventory]);
      fetchDashboardData();
      toast({
        title: "New Inventory Item Added",
        description: `${newItem.item} has been added to inventory`,
      });
    };

    socket.on('pet:added', handlePetAdded);
    socket.on('inventory:added', handleInventoryAdded);

    return () => {
      isMounted = false;
      if (socket) {
        socket.off('pet:added', handlePetAdded);
        socket.off('inventory:added', handleInventoryAdded);
      }
    };
  }, [socket, fetchDashboardData]);

  // Improved chat socket cleanup
  useEffect(() => {
    if (!socket || !currentConversation) return;

    let isMounted = true;

    // Join the conversation room
    socket.emit('join_conversation', currentConversation._id);

    const handleReceiveMessage = (data: any) => {
      if (!isMounted) return;
      if (data.conversationId === currentConversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
      
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

    const handleUserTyping = (data: any) => {
      if (!isMounted) return;
      if (data.conversationId === currentConversation._id) {
        setTypingStatus(`${data.user.fullName || data.user.username} is typing...`);
      }
    };

    const handleUserStopTyping = (data: any) => {
      if (!isMounted) return;
      if (data.conversationId === currentConversation._id) {
        setTypingStatus("");
      }
    };

    const handleMessagesRead = (data: any) => {
      if (!isMounted) return;
      if (data.conversationId === currentConversation._id) {
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
      isMounted = false;
      if (socket) {
        socket.emit('leave_conversation', currentConversation._id);
        socket.off('receive_message', handleReceiveMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
        socket.off('messages_read', handleMessagesRead);
      }
    };
  }, [socket, currentConversation]);

  // Improved realtime updates cleanup
  useEffect(() => {
    if (!socket || !user) return;

    let isMounted = true;

    const handleRealtimeUpdate = () => {
      if (!isMounted) return;
      setTimeout(() => {
        if (isMounted) {
          try {
            fetchDashboardData();
          } catch (error) {
            console.error('Error in real-time update:', error);
          }
        }
      }, 100);
    };

    const events = [
      "pets_updated",
      "bookings_updated",
      "prescriptions_updated",
      "users_updated",
      "pets_under_treatment_updated",
      "emrs_updated",
      "inventory_updated",
      "admins_updated",
      "clinical_notes_updated",
      "video_consultations_updated"
    ];

    events.forEach(event => {
      socket.off(event, handleRealtimeUpdate);
      socket.on(event, handleRealtimeUpdate);
    });

    return () => {
      isMounted = false;
      events.forEach(event => {
        socket.off(event, handleRealtimeUpdate);
      });
    };
  }, [socket, user, fetchDashboardData]);





  // Handle Google Meet creation - open dialog directly
  const handleCreateGoogleMeet = (appointment: VideoConsultation) => {
    console.log('📹 Opening Google Meet dialog for appointment:', appointment);
    setSelectedAppointmentForMeet(appointment);
    setGoogleMeetDialogOpen(true);
  }

  // Handle Google Meet dialog success
  const handleGoogleMeetSuccess = () => {
    console.log('✅ Google Meet link created successfully');
    setGoogleMeetDialogOpen(false);
    setSelectedAppointmentForMeet(null);
    // Refresh video consultations to get the updated Meet link
    fetchVideoConsultations();
    toast({
      title: "Success",
      description: "Google Meet link created and emails sent successfully!",
    });
  }

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
      const res = await fetch("http://localhost:8080/api/vet-clinic/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Appointments tab: Show only PENDING appointments (both in-person and online)
          const pendingAppointments = data.data.filter((b: Booking) => 
            b.status === 'pending'
          );
          
          console.log(`📋 Found ${pendingAppointments.length} pending appointments for approval`);
          
          // Map the bookings to the Appointment interface
          const mappedAppointments = pendingAppointments.map((booking: Booking) => {
            const startTime = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
            if (booking.appointmentTime) {
              const [hours, minutes] = booking.appointmentTime.split(':').map(Number);
              startTime.setHours(hours, minutes, 0, 0);
            }
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30); // Assume 30 min appointments
            
            return {
              _id: booking._id,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              type: booking.type || 'in person',
              status: booking.status || 'pending',
              pet: booking.pet,
              user: booking.petOwner,
              doctor: { name: 'Doctor' }, // Placeholder
              notes: booking.reason,
              googleMeetLink: booking.googleMeetLink
            };
          });
          
          setAppointments(mappedAppointments);
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
      const res = await fetch("http://localhost:8080/api/vet-clinic/video-consultations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Video consultations data:", data);
        setVideoConsultations(data.data || []);
      } else {
        console.error("Failed to fetch video consultations");
      }
    } catch (error) {
      console.error("Error fetching video consultations:", error);
    } finally {
      setVideoConsultationsLoading(false);
    }
  };

  

  // Fetch inventory
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/vet-clinic/inventory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setInventory(data.data || []);
      } else {
        console.error("Failed to fetch inventory");
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

  // Load dashboard data on mount
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchActivityFeed();
      fetchUsers();
      fetchMedicines();
      fetchPets(); // Fetch pets on mount
      fetchVideoConsultations(); // Fetch video consultations on mount
    }
  }, [user]);

  // Handle tab changes to load data
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTabValue(value);
    
    if (value === 'pets' && pets.length === 0) {
      fetchPets();
    } else if (value === 'medical-records' && medicalRecords.length === 0) {
      fetchMedicalRecords();
    } else if (value === 'appointments' && appointments.length === 0) {
      fetchAppointments();
    } else if (value === 'pets-under-treatment' && petsUnderTreatment.length === 0) {
      fetchPetsUnderTreatment();
    } else if (value === 'inventory' && inventory.length === 0) {
      fetchInventory();
    } else if (value === 'video-consultations' && videoConsultations.length === 0) {
      fetchVideoConsultations();
    }
    
    if (value !== 'inbox') {
      setInboxTab("conversations");
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

  // Handle viewing a medical record
  const handleViewMedicalRecord = async (record: MedicalRecord) => {
    try {
      // Fetch the full record details if needed
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`http://localhost:8080/api/emr/${record._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch medical record details");
      }
      
      const data = await response.json();
      setSelectedMedicalRecord(data.data);
      setMedicalRecordDialogOpen(true);
    } catch (error) {
      console.error("Error fetching medical record details:", error);
      toast({
        title: "Error",
        description: "Failed to load medical record details",
        variant: "destructive"
      });
    }
  };

  // Handle archiving a medical record
  const handleArchiveMedicalRecord = async (recordId: string, archived: boolean) => {
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
      
      const response = await fetch(`http://localhost:8080/api/emr/${recordId}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ archived })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to archive medical record");
      }
      
      toast({
        title: "Success",
        description: `Medical record ${archived ? 'archived' : 'unarchived'} successfully`
      });
      
      fetchMedicalRecords();
      fetchDashboardData();
    } catch (error) {
      console.error("Archive medical record error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update medical record",
        variant: "destructive"
      });
    }
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
      
      const response = await fetch(`http://localhost:8080/api/emr/${recordId}`, {
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

      // Prepare the medical record data
      const medicalRecordData = {
        petId: selectedPet._id,
        name: selectedPet.name,
        species: selectedPet.species || selectedPet.breed || 'Not specified',
        breed: selectedPet.breed || 'Not specified',
        age: selectedPet.age || 0,
        sex: selectedPet.gender || 'Not specified',
        owner: {
          name: selectedPet.owner?.fullName || 'Pet Owner',
          phone: selectedPet.owner?.contactNumber || 'Not provided',
          email: selectedPet.owner?.email || 'Not provided',
          address: selectedPet.owner?.address || 'Not provided',
        },
        vaccinations: formData.vaccinations || [],
        medicalHistory: formData.medicalHistory || [],
        visitHistory: formData.visitHistory || [],
        currentVisit: formData.currentVisit || {},
      };

      const response = await fetch("http://localhost:8080/api/emr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(medicalRecordData),
      });

      const data = await response.json();
      if (response.ok && data) {
        toast({
          title: "Success",
          description: "Medical record created successfully",
        });
        setAddMedicalRecordDialogOpen(false);
        fetchMedicalRecords();
        fetchDashboardData();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create medical record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating medical record:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create medical record",
        variant: "destructive",
      });
    }
  };

  

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    // Implementation for viewing appointment details
    console.log("Viewing appointment details:", appointment);
  };

  // This function has been replaced with inline code in the button

  const handleRefreshData = () => {
    fetchDashboardData();
    fetchActivityFeed();
    fetchPetsUnderTreatment();
    fetchVideoConsultations(); // Add this line to refresh video consultations
    
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
        role: "clinic"
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
      setInboxTab("conversations");
    }
  }, [activeTabValue, user]);

  const [showArchived, setShowArchived] = useState(false);

  // Find where we're rendering medical records and add a way to show the EMRViewer
  const handleViewEMR = (emr: any) => {
    setSelectedMedicalRecord(emr);
    setMedicalRecordDialogOpen(true);
  };

  // Handle viewing a prescription
  const handleViewPrescription = (prescription: Prescription) => {
    console.log("Viewing prescription:", prescription);
  };

  // Add or subtract stock
  const handleChangeStock = async (id: string, amount: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/vet-clinic/inventory/${id}/stock`, {
        method: "PUT",
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

  // Helper function to calculate time since last visit
  const getTimeSinceLastVisit = (visitHistory: any[]) => {
    if (visitHistory.length === 0) return null;
    
    const lastVisit = visitHistory[visitHistory.length - 1];
    const lastVisitDate = new Date(lastVisit.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Helper function to get last visit details
  const getLastVisitDetails = (record: MedicalRecord) => {
    if (record.visitHistory.length === 0) {
      return { date: null, reason: null, veterinarian: null, timeAgo: null };
    }
    
    const lastVisit = record.visitHistory[record.visitHistory.length - 1];
    return {
      date: new Date(lastVisit.date),
      reason: lastVisit.reason,
      veterinarian: lastVisit.veterinarian,
      timeAgo: getTimeSinceLastVisit(record.visitHistory)
    };
  };

  const handleConnectGoogle = () => {
    if (!user?._id) {
      alert('User not loaded. Please try again.');
      return;
    }
    // Redirect to backend endpoint for Google OAuth, including clinicId
    window.location.href = `http://localhost:8080/api/google-meet/auth?clinicId=${user._id}`;
  };

  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all');
  const filteredAppointments = useMemo(() => {
    if (appointmentTypeFilter === 'all') return appointments || [];
    return (appointments || []).filter((a: any) => a.type === appointmentTypeFilter);
  }, [appointments, appointmentTypeFilter]);

  const { dismiss } = useToast();

  // Cleanup all toasts on unmount to prevent DOM errors
  useEffect(() => {
    return () => {
      dismiss(); // Dismiss all toasts
    };
  }, [dismiss]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardSkeleton />
          </div>
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
                  setInboxTab("conversations");
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

      {/* Connect Google Button for Clinic Admins */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
        <p style={{ marginBottom: 8 }}>
          <strong>Connect your Google account</strong> to enable Google Meet links for online consultations.
        </p>
        <Button onClick={handleConnectGoogle} variant="outline" style={{ background: '#fff', color: '#4285F4', border: '1px solid #4285F4' }}>
          <svg style={{ marginRight: 8 }} width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 30.1 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.9 0 5.5 1 7.6 2.7l6.4-6.4C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 20.8-17.5.1-.8.2-1.5.2-2.5 0-1.3-.1-2.2-.2-3z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.9 0 5.5 1 7.6 2.7l6.4-6.4C34.5 5.1 29.5 3 24 3c-7.2 0-13.5 3.1-17.7 8z"/><path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.8 14.4-4.9l-6.7-5.5C29.5 36.9 26.9 38 24 38c-6.1 0-10.7-3-13.3-7.3l-6.6 5.1C7.5 41.9 15.2 45 24 45z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.2-4.3 5.5-7.3 6.5l6.7 5.5C38.7 41.2 43.6 34.9 43.6 27.5c0-1.3-.1-2.2-.2-3z"/></g></svg>
          Connect Google
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTabValue} defaultValue="overview" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="dark:text-white flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="pets" className="dark:text-white flex-shrink-0">Pets</TabsTrigger>
            <TabsTrigger value="medical-records" className="dark:text-white flex-shrink-0">Medical Records</TabsTrigger>
            <TabsTrigger value="appointments" className="dark:text-white flex-shrink-0">Appointments</TabsTrigger>
            <TabsTrigger value="pets-under-treatment" className="dark:text-white flex-shrink-0">Pets Under Treatment</TabsTrigger>
            <TabsTrigger value="inventory" className="dark:text-white flex-shrink-0">Inventory</TabsTrigger>
            <TabsTrigger value="inbox" className="dark:text-white flex-shrink-0">Inbox</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardAnalytics data={dashboardData as any} />
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
                        <TableHead className="text-gray-900 dark:text-white">Category</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Type</TableHead>
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
                          <TableCell className="text-gray-900 dark:text-white">{pet.category || 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{pet.species || 'N/A'}</TableCell>
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
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                      Show Archived
                    </label>
                    <Button onClick={() => {
                      fetchPets(); // Fetch pets before opening the dialog
                      setAddMedicalRecordDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medical Record
                    </Button>
                  </div>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords
                        .filter(record => showArchived ? record.archived : !record.archived)
                        .map((record) => (
                          <TableRow key={record._id} className={`hover:bg-gray-100 dark:hover:bg-gray-800 ${record.archived ? 'opacity-60' : ''}`}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">{record.name}</TableCell>
                            <TableCell className="text-gray-900 dark:text-white">{record.species}</TableCell>
                            <TableCell className="text-gray-900 dark:text-white">{record.owner?.name || 'No owner info'}</TableCell>
                            <TableCell>
                              {(() => {
                                const lastVisit = getLastVisitDetails(record);
                                if (!lastVisit.date) {
                                  return (
                                    <div className="text-gray-500 text-sm">
                                      <div>No visits</div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">
                                      {lastVisit.date.toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {lastVisit.timeAgo}
                                    </div>
                                    {lastVisit.reason && (
                                      <div className="text-xs text-gray-600 max-w-[150px] truncate" title={lastVisit.reason}>
                                        {lastVisit.reason}
                                      </div>
                                    )}
                                    {lastVisit.veterinarian && (
                                      <div className="text-xs text-blue-600">
                                        Dr. {lastVisit.veterinarian}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-white">{record.vaccinations.length} vaccines</TableCell>
                            <TableCell>
                              {record.archived ? (
                                <span className="text-xs text-gray-500">Archived</span>
                              ) : (
                                <span className="text-xs text-green-600">Active</span>
                              )}
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewMedicalRecord(record)}>
                                View EMR
                              </Button>
                              {!record.archived && (
                                <Button variant="outline" size="sm" onClick={() => handleArchiveMedicalRecord(record._id, true)}>
                                  Archive
                                </Button>
                              )}
                              {record.archived && (
                                <Button variant="outline" size="sm" onClick={() => handleArchiveMedicalRecord(record._id, false)}>
                                  Unarchive
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

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">Appointments</CardTitle>
                    <CardDescription>All appointments (in-person and online)</CardDescription>
                  </div>
                  <select
                    className="border rounded px-2 py-1"
                    value={appointmentTypeFilter}
                    onChange={e => setAppointmentTypeFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="in person">In Person</option>
                    <option value="online">Online</option>
                  </select>
                </div>
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
                      {filteredAppointments.map((appointment: any) => (
                        <TableRow key={appointment._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {appointment.startTime ? (
                              <>
                                {new Date(appointment.startTime).toLocaleDateString()} <br />
                                {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : (
                              'No date/time'
                            )}
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
                                  await fetch(`http://localhost:8080/api/vet-clinic/bookings/${appointment._id}/approve`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/vet-clinic/bookings/${appointment._id}/reject`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  await fetchAppointments();
                                  await fetchVideoConsultations();
                                }}>Reject</Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedAppointment(appointment); setDetailsOpen(true); }}>
                                  View Details
                                </Button>
                                {appointment.type === 'online' && appointment.status === 'confirmed' && appointment.googleMeetLink && (
                                  <a 
                                    href={appointment.googleMeetLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Button className="bg-green-600 hover:bg-green-700">
                                      <Video className="w-4 h-4 mr-2" />
                                      Join Call
                                    </Button>
                                  </a>
                                )}
                              </div>
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
                              <p className="text-sm text-gray-500">{treatment.pet.category} &bull; {treatment.pet.breed} &bull; {treatment.pet.age} years</p>
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
                                <Button variant="outline" size="sm" onClick={() => {
                                  // Contact Owner: open chat inbox and select owner
                                  setActiveTabValue('inbox');
                                  setSelectedPetOwner(treatment.pet.owner);
                                }}>
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
                </div>
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No prescriptions found.</p>
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
                <CardTitle className="text-gray-900 dark:text-white">Inventory Management</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Input
                    placeholder="Search by name..."
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className="w-48"
                  />
                  <select value={inventoryCategory} onChange={e => setInventoryCategory(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">All Categories</option>
                    <option value="Medication">Medication</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Food">Food</option>
                    <option value="Vaccine">Vaccine</option>
                  </select>
                  <select value={inventoryStatus} onChange={e => setInventoryStatus(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">All Status</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                  <select value={inventoryExpiration} onChange={e => setInventoryExpiration(e.target.value)} className="border rounded px-2 py-1">
                    <option value="all">All Expiration</option>
                    <option value="soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory
                      .filter(item => item.item.toLowerCase().includes(inventorySearch.toLowerCase()))
                      .filter(item => !inventoryCategory || item.category === inventoryCategory)
                      .filter(item => !inventoryStatus || item.status === inventoryStatus)
                      .filter(item => {
                        if (inventoryExpiration === 'soon') {
                          if (!item.expirationDate) return false;
                          const days = (Number(new Date(item.expirationDate ?? '')) - Number(new Date())) / (1000*60*60*24);
                          return days >= 0 && days <= 7;
                        }
                        if (inventoryExpiration === 'expired') {
                          if (!item.expirationDate) return false;
                          return Number(new Date(item.expirationDate ?? '')) < Number(new Date());
                        }
                        return true;
                      })
                      .map(item => {
                        let expClass = '';
                        if (item.expirationDate) {
                          const days = (Number(new Date(item.expirationDate ?? '')) - Number(new Date())) / (1000*60*60*24);
                          if (days >= 0 && days <= 7) expClass = 'bg-yellow-100 text-yellow-800';
                          if (days < 0) expClass = 'bg-red-100 text-red-800';
                        }
                        return (
                          <TableRow key={item._id} className={expClass}>
                            <TableCell>{item.item}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.stock}</TableCell>
                            <TableCell>{item.minStock}</TableCell>
                            <TableCell>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateInventory(item)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteInventoryItem(item._id)} className="ml-2">Delete</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
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
          onArchive={handleArchiveMedicalRecord}
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
                  
                  {selectedAppointment.type === 'online' && selectedAppointment.status === 'confirmed' && selectedAppointment.googleMeetLink && (
                    <div className="mt-4 pt-4 border-t">
                      <div><strong>Google Meet Link:</strong></div>
                      <div className="mt-2 flex flex-col gap-2">
                        <a 
                          href={selectedAppointment.googleMeetLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 underline break-all"
                        >
                          {selectedAppointment.googleMeetLink}
                        </a>
                        <a 
                          href={selectedAppointment.googleMeetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Video className="w-4 h-4 mr-2" />
                            Start Call
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}
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

      {/* Google Meet Dialog */}
      <GoogleMeetDialog
        open={googleMeetDialogOpen}
        onClose={() => {
          setGoogleMeetDialogOpen(false);
          setSelectedAppointmentForMeet(null);
        }}
        appointment={selectedAppointmentForMeet}
        onSuccess={handleGoogleMeetSuccess}
      />

    </div>
  );
}
  