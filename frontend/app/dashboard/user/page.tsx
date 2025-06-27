"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useSocket } from "@/app/context/SocketContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Calendar, Heart, Video, FileText, Clock, User, LogOut, Plus, Trash2, Settings, Moon, Sun, Laptop, MessageSquare, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EMRViewer } from "@/components/EMRViewer"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { getUserPreferences, saveUserPreferences } from "@/lib/storage"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
  profilePicture?: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
}

interface Booking {
  _id: string;
  bookingDate: string;
  appointmentTime: string;
  status: string;
  pet: Pet;
  clinic: any;
  reason: string;
  type?: string;
  doctor?: Doctor;
  startTime?: string;
  googleMeetLink?: string;
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
  pets: Pet[];
  bookings: Booking[];
  petsUnderTreatment: PetUnderTreatment[];
}

export default function UserDashboard() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pets: [],
    bookings: [],
    petsUnderTreatment: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { socket } = useSocket();

  const [emrs, setEmrs] = useState<any[]>([]);
  const [emrsLoading, setEmrsLoading] = useState(true);
  const [emrsError, setEmrsError] = useState<string | null>(null);
  const [isEMRViewerOpen, setIsEMRViewerOpen] = useState(false);
  const [selectedEMR, setSelectedEMR] = useState<any | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<any | null>(null);
  const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNoEMRDialog, setShowNoEMRDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [inboxTab, setInboxTab] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const role = localStorage.getItem("role")

    // Check if user is not a pet owner, redirect to appropriate dashboard
    if (role && role !== "pet owner" && role !== "user") {
      console.log(`Redirecting ${role} from user dashboard to correct dashboard`)
      switch (role) {
        case "clinic":
          router.push("/dashboard/clinic")
          return
        case "doctor":
          router.push("/dashboard/doctor")
          return
        case "admin":
          router.push("/dashboard/admin")
          return
        case "super admin":
          router.push("/dashboard/super-admin")
          return
        case "staff":
          router.push("/dashboard/staff")
          return
      }
      return
    }
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (!parsedUser.name) {
          parsedUser.name = parsedUser.fullName || parsedUser.clinicName || "";
        }
        setUser(parsedUser);
        fetchDashboardData(parsedUser._id)
        fetchEMRs()
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
      fetchDashboardData(user._id);
    };
    [
      "pets_updated",
      "bookings_updated",
      "users_updated",
      "pets_under_treatment_updated",
      "emrs_updated",
    ].forEach(event => {
      socket.on(event, handleRealtimeUpdate);
    });
    
    // Cleanup
    return () => {
      [
        "pets_updated",
        "bookings_updated",
        "users_updated",
        "pets_under_treatment_updated",
        "emrs_updated",
      ].forEach(event => {
        socket.off(event, handleRealtimeUpdate);
      });
    };
  }, [socket, user]);

  const fetchDashboardData = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      // Fetch main dashboard data
      const res = await fetch(`http://localhost:8080/api/users/${userId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      
      // Fetch pets under treatment data
      const petsUnderTreatmentRes = await fetch("http://localhost:8080/api/pets-under-treatment/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const petsUnderTreatmentData = await petsUnderTreatmentRes.json();
      
      if (data.success) {
        // Make sure bookings have the necessary properties
        const processedBookings = data.data.bookings.map((booking: any) => {
          // Convert bookingDate and appointmentTime to a startTime
          let startTime = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
          if (booking.appointmentTime) {
            const [hours, minutes] = booking.appointmentTime.split(':').map(Number);
            startTime.setHours(hours, minutes, 0, 0);
          }
          
          return {
            ...booking,
            startTime: startTime.toISOString(),
            // Ensure googleMeetLink is properly passed through
            googleMeetLink: booking.googleMeetLink || null
          };
        });
        
        setDashboardData({
          ...data.data,
          bookings: processedBookings,
          petsUnderTreatment: petsUnderTreatmentData.success ? petsUnderTreatmentData.data : []
        });
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message);
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEMRs = async () => {
    setEmrsLoading(true);
    setEmrsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("http://localhost:8080/api/emr/user/pets", {
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

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

  const handleDeletePet = async (petId: string) => {
    if (!window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/pets/${petId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete pet");
      // Refresh dashboard data
      fetchDashboardData(user._id);
    } catch (e) {
      alert("Failed to delete pet. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewEMR = async (petId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      // Get EMRs for this specific pet
      const res = await fetch(`http://localhost:8080/api/emr/pet/${petId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch EMRs");
      
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        // If EMR exists, show it in the EMR viewer
        setSelectedEMR(data.data[0]); // Show the most recent EMR
        setIsEMRViewerOpen(true);
      } else {
        // If no EMR exists, show the "No Medical Record" dialog
        setShowNoEMRDialog(true);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch medical records",
        variant: "destructive"
      });
    }
  };

  // Load user preferences when settings dialog opens
  useEffect(() => {
    if (settingsOpen) {
      const preferences = getUserPreferences();
      setNotificationsEnabled(preferences.notificationsEnabled);
    }
  }, [settingsOpen]);

  // Save notification preference when changed
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    saveUserPreferences({ notificationsEnabled: checked });
    toast({
      title: checked ? "Notifications Enabled" : "Notifications Disabled",
      description: checked 
        ? "You will now receive notifications about appointments and updates." 
        : "You will no longer receive notifications.",
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      
      const res = await fetch("http://localhost:8080/api/users/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) throw new Error("Failed to delete account")
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all associated data have been successfully deleted.",
        })
        
        // Clear local storage and redirect to home page
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        router.push("/")
      } else {
        throw new Error(data.message || "Failed to delete account")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  // Fetch clinics for inbox
  useEffect(() => {
    if (!user || !inboxTab) return;
    
    const fetchClinics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/chat/clinics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch clinics");
        const data = await res.json();
        setClinics(data.data.clinics || []);
      } catch (e) {
        console.error("Error fetching clinics:", e);
        toast({
          title: "Error",
          description: "Failed to load clinics. Please try again.",
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
    
    fetchClinics();
    fetchConversations();
  }, [user, inboxTab]);

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
        setTypingStatus(`${data.user.fullName || data.user.clinicName} is typing...`);
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
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Mark messages as read via Socket.IO
    if (socket && currentConversation.unreadCount > 0) {
      socket.emit('mark_read', {
        conversationId: currentConversation._id,
        userId: user._id
      });
    }
  }, [currentConversation]);

  // Start a new conversation or open existing one
  const handleSelectClinic = async (clinic: any) => {
    // Check if conversation already exists with this clinic
    const existingConversation = conversations.find(conv => 
      conv.participant && conv.participant._id === clinic._id
    );
    
    if (existingConversation) {
      setCurrentConversation(existingConversation);
      setSelectedClinic(clinic);
      return;
    }
    
    // Start a new conversation
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/chat/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ clinicId: clinic._id })
      });
      
      if (!res.ok) throw new Error("Failed to start conversation");
      
      const data = await res.json();
      setCurrentConversation(data.data);
      setSelectedClinic(clinic);
      
      // Add to conversations list
      setConversations(prev => [data.data, ...prev]);
    } catch (e) {
      console.error("Error starting conversation:", e);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation) return;
    
    const messageText = messageInput.trim();
    setMessageInput("");
    
    // Optimistically add message to UI
    const optimisticMessage = {
      _id: Date.now().toString(),
      sender: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      text: messageText,
      createdAt: new Date().toISOString(),
      read: false
    };
    
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
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id ? data.data : msg
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    }
  };

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (socket && currentConversation) {
      socket.emit('typing', {
        conversationId: currentConversation._id,
        user: {
          _id: user._id,
          fullName: user.fullName
        }
      });
      
      // Clear typing indicator after delay
      setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: currentConversation._id,
          user: {
            _id: user._id,
            fullName: user.fullName
          }
        });
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchDashboardData(user._id)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Filter all upcoming appointments (both in-person and video consultations)
  const upcomingAppointments = dashboardData.bookings.filter(
    apt => apt.status === 'scheduled'
  )

  // Update the booking type display
  const getBookingTypeDisplay = (type: string | undefined) => {
    if (type === 'online') return 'Online Consultation';
    if (type === 'in person') return 'In Person Appointment';
    return type || 'Appointment';
  }

  const videoAppointments = dashboardData.bookings.filter(a => a.type === 'online');
  const inPersonAppointments = dashboardData.bookings.filter(a => a.type === 'in person');

  // Before rendering, define a function or variable to get the status label as a string
  function getStatusLabel(status: string) {
    if (status === 'pending') return 'Pending';
    if (status === 'scheduled') return 'Scheduled';
    if (status === 'completed') return 'Completed';
    if (status === 'rejected') return 'Rejected';
    return status;
  }

  // Group EMRs by pet
  const emrsByPet: { [key: string]: any[] } = (emrs || []).reduce((acc: { [key: string]: any[] }, emr: any) => {
    const petId = emr.petId?._id || emr.petId;
    if (!acc[petId]) acc[petId] = [];
    acc[petId].push(emr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image 
                src="/peteat-logo.png" 
                alt="Logo" 
                width={50} 
                height={50}
                className="rounded" 
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">PetEat</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mr-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                    <DialogDescription>
                      Customize your experience and manage account preferences.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-sm font-medium">Appearance</h3>
                      <RadioGroup
                        defaultValue={theme}
                        onValueChange={setTheme}
                        className="grid grid-cols-3 gap-2"
                      >
                        <div className="flex items-center justify-center space-y-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="space-y-1 text-center">
                            <Sun className="h-5 w-5 mx-auto" />
                            <RadioGroupItem value="light" id="light" className="sr-only" />
                            <Label htmlFor="light" className="block text-sm">Light</Label>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-y-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="space-y-1 text-center">
                            <Moon className="h-5 w-5 mx-auto" />
                            <RadioGroupItem value="dark" id="dark" className="sr-only" />
                            <Label htmlFor="dark" className="block text-sm">Dark</Label>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-y-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="space-y-1 text-center">
                            <Laptop className="h-5 w-5 mx-auto" />
                            <RadioGroupItem value="system" id="system" className="sr-only" />
                            <Label htmlFor="system" className="block text-sm">System</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about appointments and updates.
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={handleNotificationsChange}
                      />
                    </div>
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSettingsOpen(false);
                            setTimeout(() => setShowDeleteConfirmation(true), 100);
                          }}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleLogout} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your pets and appointments</p>
        </div>

        {/* Add EMR Viewer */}
        {selectedEMR && (
          <EMRViewer
            emrId={selectedEMR._id}
            isOpen={isEMRViewerOpen}
            onClose={() => {
              setIsEMRViewerOpen(false);
              setSelectedEMR(null);
            }}
          />
        )}

        {/* Treatment Details Dialog */}
        {selectedTreatment && (
          <Dialog open={isTreatmentDialogOpen} onOpenChange={setIsTreatmentDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Treatment Details - {selectedTreatment.pet.name}</DialogTitle>
                <DialogDescription>
                  Admission info and latest notes from the clinic.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Clinic</p>
                    <p className="font-medium">{selectedTreatment.clinic?.name || 'Clinic'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Room</p>
                    <p className="font-medium">{selectedTreatment.room}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{selectedTreatment.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Admitted</p>
                    <p className="font-medium">{new Date(selectedTreatment.admissionDate).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Diagnosis</p>
                  <p>{selectedTreatment.diagnosis || 'No diagnosis recorded'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Clinic Notes</p>
                  <p>{selectedTreatment.clinicalNotes || 'No notes recorded'}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant={inboxTab ? "default" : "outline"} 
                size="icon" 
                onClick={() => setInboxTab(!inboxTab)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <div className="mb-4 w-full overflow-x-auto">
              <TabsList className="flex flex-wrap gap-1 w-full">
                {!inboxTab ? (
                  <>
                    <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
                    <TabsTrigger value="pets" className="flex-shrink-0">My Pets</TabsTrigger>
                    <TabsTrigger value="appointments" className="flex-shrink-0">Appointments</TabsTrigger>
                    <TabsTrigger value="video-consultations" className="flex-shrink-0">Online Consultations</TabsTrigger>
                    <TabsTrigger value="in-person" className="flex-shrink-0">In Person Appointments</TabsTrigger>
                    <TabsTrigger value="hospitalizations" className="flex-shrink-0">Hospitalizations</TabsTrigger>
                    <TabsTrigger value="medical-records" className="flex-shrink-0">Medical Records</TabsTrigger>
                  </>
                ) : (
                  <TabsTrigger value="inbox" className="flex-shrink-0">Inbox</TabsTrigger>
                )}
                <div className="ml-auto">
                  {inboxTab && (
                    <Button variant="outline" size="sm" onClick={() => setInboxTab(false)}>
                      Return to Dashboard
                    </Button>
                  )}
                </div>
              </TabsList>
            </div>

            {inboxTab && (
              <TabsContent value="inbox" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
                  {/* Sidebar with clinics */}
                  <div className="border rounded-lg p-4 h-full flex flex-col">
                    <h3 className="text-lg font-medium mb-4">Clinics</h3>
                    <div className="flex-1 overflow-y-auto">
                      {(clinics || []).length === 0 ? (
                        <p className="text-muted-foreground">No clinics available.</p>
                      ) : (
                        <ul className="space-y-2">
                          {(clinics || []).map(clinic => (
                            <li 
                              key={clinic._id} 
                              className={`p-2 rounded cursor-pointer ${
                                selectedClinic && selectedClinic._id === clinic._id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-accent'
                              }`}
                              onClick={() => handleSelectClinic(clinic)}
                            >
                              <div className="font-medium flex items-center gap-2">
                                {clinic.clinicName || clinic.fullName || clinic.name}
                                {clinic.status && (
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    clinic.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    clinic.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    clinic.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {clinic.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{clinic.address || clinic.email}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Chat window */}
                  <div className="border rounded-lg md:col-span-2 h-full flex flex-col">
                    {selectedClinic ? (
                      <>
                        <div className="border-b p-4 bg-background">
                          <div className="font-bold text-lg">{selectedClinic.clinicName || selectedClinic.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedClinic.address || selectedClinic.email}</div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto max-h-[calc(70vh-120px)]">
                          {(messages || []).length === 0 ? (
                            <div className="text-center text-muted-foreground h-full flex flex-col justify-center">
                              <p>No messages yet</p>
                              <p className="text-sm">Send a message to start the conversation</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(messages || []).map((message) => {
                                const isOwnMessage = message.sender && message.sender._id === user._id;
                                
                                return (
                                  <div 
                                    key={message._id} 
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div 
                                      className={`max-w-[70%] p-3 rounded-lg ${
                                        isOwnMessage
                                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                                        : 'bg-accent text-accent-foreground rounded-bl-none'
                                      }`}
                                    >
                                      <div className="text-sm">{message.text}</div>
                                      <div className="text-xs opacity-70 text-right mt-1">
                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isOwnMessage && (
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
                              <div ref={chatEndRef}></div>
                            </div>
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
                            <input
                              className="flex-1 border rounded px-3 py-2"
                              type="text"
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={handleInputChange}
                            />
                            <Button type="submit" disabled={!messageInput.trim() || isLoading}>Send</Button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a clinic to start a conversation.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
            
            <TabsContent value="overview" className="space-y-6">
              <DashboardAnalytics data={{
                totalPets: dashboardData.pets.length,
                upcomingAppointments: upcomingAppointments.length,
              }} />

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Recent Appointments & Consultations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(dashboardData.bookings || []).slice(0, 3).map((booking) => (
                        <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {getBookingTypeDisplay(booking.type)}
                              {booking.doctor ? ` with ${booking.doctor.name}` : ' at clinic'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(() => {
                                let dateString = "No date specified";
                                let timeString = "No time specified";
                                if (
                                  booking.startTime &&
                                  booking.startTime !== "No date specified"
                                ) {
                                  const date = new Date(booking.startTime);
                                  if (!isNaN(date.getTime())) {
                                    dateString = date.toLocaleDateString();
                                    timeString = date.toLocaleTimeString();
                                  }
                                }
                                return `${dateString} at ${timeString}`;
                              })()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {getStatusLabel(booking.status)}
                            </Badge>
                            {booking.type === 'online' && booking.status === 'confirmed' && booking.googleMeetLink && (
                              <a 
                                href={booking.googleMeetLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                                  <Video className="w-4 h-4 mr-2" />
                                  Start Call
                                </Button>
                              </a>
                            )}
                            {booking.type === 'online' && (
                              <Link href={`/dashboard/user/video-consultation?appointment=${booking._id}`}>
                                <Button variant="outline" size="sm" className="bg-blue-100 hover:bg-blue-200 text-blue-800">
                                  <Video className="h-4 w-4 mr-1" />
                                  View Online Consultation
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                      {(dashboardData.bookings || []).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No appointments scheduled</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/dashboard/user/schedule-appointment">
                      <Button className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Appointment
                      </Button>
                    </Link>
                    <Link href="/dashboard/user/add-pet">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Pet
                      </Button>
                    </Link>
                    {videoAppointments.length > 0 && (
                      <Link href={`/dashboard/user/video-consultation?appointment=${videoAppointments[0]._id}`}>
                        <Button variant="outline" className="w-full justify-start">
                          <Video className="h-4 w-4 mr-2" />
                          Start Online Consultation
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pets" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Pets</h2>
                <Link href="/dashboard/user/add-pet">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Pet
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(dashboardData.pets || []).map((pet) => (
                  <Card key={pet._id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                          {pet.profilePicture ? (
                            <Image
                              src={pet.profilePicture}
                              alt={pet.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src="/placeholder.jpg"
                              alt={pet.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{pet.name}</h3>
                          <p className="text-gray-500">{pet.breed}</p>
                          <p className="text-sm text-gray-500">Age: {pet.age} years</p>
                          <p className="text-sm text-gray-500">Weight: {pet.weight} kg</p>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewEMR(pet._id)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Medical Records
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => {
                              setDeletePetId(pet._id);
                              setShowDeleteConfirmation(true);
                            }}
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(dashboardData.pets || []).length === 0 && (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500">You don't have any pets yet.</p>
                    <p className="text-gray-500">Click "Add Pet" to register your first pet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">All Appointments</h2>
                <Link href="/dashboard/user/schedule-appointment">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule New
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {(dashboardData.bookings || []).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No appointments scheduled</p>
                    <Link href="/dashboard/user/schedule-appointment">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Your First Appointment
                      </Button>
                    </Link>
                  </div>
                )}
                {(dashboardData.bookings || []).map((booking) => (
                  <Card key={booking._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {getBookingTypeDisplay(booking.type)}
                              {booking.doctor ? ` with ${booking.doctor.name}` : ' at clinic'}
                            </h3>
                            <Badge className={
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{booking.doctor ? booking.doctor.email : null}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {(() => {
                                let dateString = "No date specified";
                                if (
                                  booking.startTime &&
                                  booking.startTime !== "No date specified"
                                ) {
                                  const date = new Date(booking.startTime);
                                  if (!isNaN(date.getTime())) {
                                    dateString = date.toLocaleDateString();
                                  }
                                }
                                return dateString;
                              })()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {(() => {
                                let timeString = "No time specified";
                                if (
                                  booking.startTime &&
                                  booking.startTime !== "No date specified"
                                ) {
                                  const date = new Date(booking.startTime);
                                  if (!isNaN(date.getTime())) {
                                    timeString = date.toLocaleTimeString();
                                  }
                                }
                                return timeString;
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {booking.status === 'confirmed' && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="video-consultations" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Online Consultations</h2>
              </div>
              <div className="space-y-4">
                {videoAppointments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No online consultations scheduled</p>
                    <Link href="/dashboard/user/schedule-appointment">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Online Consultation
                      </Button>
                    </Link>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Pet</TableHead>
                      <TableHead>Clinic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(videoAppointments || []).map((consultation) => {
                      const consultationDate = new Date(consultation.startTime || new Date());
                      const isToday = consultationDate.toDateString() === new Date().toDateString();
                      const isPast = consultationDate < new Date();
                      
                      return (
                        <TableRow key={consultation._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell>
                            {consultationDate.toLocaleDateString()} <br />
                            {consultationDate.toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {consultation.pet?.name || JSON.stringify(consultation.pet) || 'Pet'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {consultation.clinic?.clinicName || consultation.clinic?.name || JSON.stringify(consultation.clinic) || 'Clinic'}
                          </TableCell>
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
                            {consultation.reason || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/user/video-consultation?appointment=${consultation._id}`}>View Details</Button>
                              {consultation.type === 'online' && consultation.status === 'confirmed' && consultation.googleMeetLink && (
                                <a href={consultation.googleMeetLink} target="_blank" rel="noopener noreferrer">
                                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Video className="w-4 h-4 mr-2" />
                                    Join Call
                                  </Button>
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="in-person" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">In Person Appointments</h2>
                <Link href="/dashboard/user/schedule-appointment">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule In Person
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {inPersonAppointments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No in-person appointments scheduled</p>
                    <Link href="/dashboard/user/schedule-appointment">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Your First Appointment
                      </Button>
                    </Link>
                  </div>
                )}
                {(inPersonAppointments || []).map((booking) => (
                  <Card key={booking._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">In Person Appointment{booking.doctor ? ` with ${booking.doctor.name}` : ' at clinic'}</h3>
                            <Badge className={
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{booking.doctor ? booking.doctor.email : null}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {(() => {
                                let dateString = "No date specified";
                                if (
                                  booking.startTime &&
                                  booking.startTime !== "No date specified"
                                ) {
                                  const date = new Date(booking.startTime);
                                  if (!isNaN(date.getTime())) {
                                    dateString = date.toLocaleDateString();
                                  }
                                }
                                return dateString;
                              })()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {(() => {
                                let timeString = "No time specified";
                                if (
                                  booking.startTime &&
                                  booking.startTime !== "No date specified"
                                ) {
                                  const date = new Date(booking.startTime);
                                  if (!isNaN(date.getTime())) {
                                    timeString = date.toLocaleTimeString();
                                  }
                                }
                                return timeString;
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {booking.status === 'confirmed' && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="hospitalizations" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hospitalizations</h2>
              </div>
              <div className="space-y-4">
                {(dashboardData.petsUnderTreatment || []).map((treatment) => (
                  <Card key={treatment._id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{treatment.pet?.name || 'Pet'}</h3>
                              <Badge className={
                                treatment.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                treatment.status === 'Stable' ? 'bg-blue-100 text-blue-800' :
                                treatment.status === 'Improving' ? 'bg-green-100 text-green-800' :
                                treatment.status === 'Recovered' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {treatment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{treatment.pet?.breed || 'Unknown'} • {treatment.pet?.age != null ? treatment.pet.age : 'N/A'} years</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Clinic</p>
                              <p className="font-medium">{treatment.clinic?.name || 'Clinic'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Room</p>
                              <p className="font-medium">{treatment.room}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Admitted</p>
                              <p className="font-medium">{new Date(treatment.admissionDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Last Updated</p>
                              <p className="font-medium">{new Date(treatment.lastUpdated).toLocaleDateString()} {new Date(treatment.lastUpdated).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-sm text-gray-500">Diagnosis</p>
                            <p className="text-sm">{treatment.diagnosis || 'No diagnosis recorded'}</p>
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-sm text-gray-500">Clinic Notes</p>
                            <p className="text-sm">{treatment.clinicalNotes || 'No notes recorded'}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" disabled={!treatment.pet}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Message Clinic
                          </Button>
                          <Button size="sm" onClick={() => { setSelectedTreatment(treatment); setIsTreatmentDialogOpen(true); }} disabled={!treatment.pet}>
                             <FileText className="h-3.5 w-3.5 mr-1.5" />
                             View Details
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(dashboardData.petsUnderTreatment || []).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">None of your pets are currently under treatment</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="medical-records" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Medical Records</h2>
              </div>
              <div className="space-y-4">
                {emrsLoading ? (
                  <p>Loading medical records...</p>
                ) : emrsError ? (
                  <p className="text-red-500">{emrsError}</p>
                ) : (emrs || []).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No medical records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pet</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Doctor/Vet</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...emrs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((emr) => (
                          <TableRow key={emr._id} className="hover:bg-blue-50 transition-colors">
                            <TableCell>
                              {emr.petId?.name || emr.name || "Pet"}
                            </TableCell>
                            <TableCell>
                              {emr.currentVisit?.date
                                ? new Date(emr.currentVisit.date).toLocaleDateString()
                                : new Date(emr.createdAt).toLocaleDateString()}
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
                                {emr.currentVisit?.status || "Not Specified"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {emr.doctor?.name || emr.clinic?.name || "Not Assigned"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEMR(emr);
                                  setIsEMRViewerOpen(true);
                                }}
                              >
                                View Full Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* No Medical Record Dialog */}
      <AlertDialog open={showNoEMRDialog} onOpenChange={setShowNoEMRDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Medical Records Found</AlertDialogTitle>
            <AlertDialogDescription>
              This pet doesn't have any medical records yet. Medical records will be created when your pet visits a veterinarian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Pet Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation && deletePetId !== null} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your pet's profile and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePetId) {
                  handleDeletePet(deletePetId);
                  setDeletePetId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteConfirmation && deletePetId === null} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? All your data will be lost.
              <div className="mt-4 space-y-2">
                <ul className="list-disc pl-5">
                  <li>Your personal information will be removed</li>
                  <li>All your registered pets will be deleted</li>
                  <li>All medical records will be permanently lost</li>
                  <li>All appointments will be deleted</li>
                </ul>
              </div>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // Prevent the dialog from closing automatically
                handleDeleteAccount()
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 rounded-full"></div>
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
