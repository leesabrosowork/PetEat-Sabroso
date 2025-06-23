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
import { Calendar, Heart, Video, FileText, Clock, User, LogOut, Plus, Trash2, Settings, Moon, Sun, Laptop, MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EMRViewer } from "@/components/EMRViewer"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { getUserPreferences, saveUserPreferences } from "@/lib/storage"

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

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor: Doctor;
  type: string;
}

interface Medicine {
  _id: string;
  name: string;
  item: string;
}

interface Prescription {
  _id: string;
  pet: Pet;
  doctor: Doctor;
  medicine: Medicine;
  description: string;
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
  pets: Pet[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  petsUnderTreatment: PetUnderTreatment[];
}

export default function UserDashboard() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pets: [],
    appointments: [],
    prescriptions: [],
    petsUnderTreatment: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { socket } = useSocket();

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
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
        case "vet clinic":
          router.push("/dashboard/vet-clinic")
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
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
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
    socket.on("pets_updated", handleRealtimeUpdate);
    socket.on("appointments_updated", handleRealtimeUpdate);
    socket.on("prescriptions_updated", handleRealtimeUpdate);
    socket.on("pets_under_treatment_updated", handleRealtimeUpdate);
    return () => {
      socket.off("pets_updated", handleRealtimeUpdate);
      socket.off("appointments_updated", handleRealtimeUpdate);
      socket.off("prescriptions_updated", handleRealtimeUpdate);
      socket.off("pets_under_treatment_updated", handleRealtimeUpdate);
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
        setDashboardData({
          ...data.data,
          petsUnderTreatment: petsUnderTreatmentData.success ? petsUnderTreatmentData.data : []
        });
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch dashboard data");
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
  const upcomingAppointments = dashboardData.appointments.filter(
    apt => apt.status === 'scheduled'
  )

  // Before rendering, define a function or variable to get the status label as a string
  function getStatusLabel(status: string) {
    if (status === 'pending') return 'Pending';
    if (status === 'scheduled') return 'Scheduled';
    if (status === 'completed') return 'Completed';
    if (status === 'rejected') return 'Rejected';
    return status;
  }

  const videoAppointments = dashboardData.appointments.filter(a => a.type === 'consultation');
  const inPersonAppointments = dashboardData.appointments.filter(a => a.type !== 'consultation');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/peteat-logo.png" alt="PetEat Logo" width={24} height={24} />
            <span className="text-xl font-bold dark:text-white">PetEat</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 dark:text-gray-300" />
              <span className="text-sm font-medium dark:text-gray-300">{user?.username}</span>
            </div>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Settings" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Customize your account preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
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
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || user?.username || 'User'}!
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
                    <p className="font-medium">{selectedTreatment.clinic.name}</p>
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
            <h1 className="text-2xl font-bold">Welcome, {user?.name || "User"}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setInboxTab(true)}>
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" /> Logout
              </Button>
            </div>
          </div>

          {inboxTab ? (
            <div className="flex h-[600px] border rounded-lg overflow-hidden">
              {/* Clinics list */}
              <div className="w-1/3 border-r bg-muted p-4 overflow-y-auto">
                <h3 className="font-bold mb-4">Conversations</h3>
                {conversations.length > 0 && (
                  <div className="mb-6">
                    <ul>
                      {conversations.map((conv) => (
                        <li
                          key={conv._id}
                          className={`p-2 rounded cursor-pointer mb-2 ${currentConversation && currentConversation._id === conv._id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                          onClick={() => {
                            setCurrentConversation(conv);
                            setSelectedClinic(conv.participant);
                          }}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium">{conv.participant?.clinicName || conv.participant?.fullName}</div>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{conv.lastMessageText || "No messages yet"}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {conv.lastMessageDate ? new Date(conv.lastMessageDate).toLocaleString() : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <h3 className="font-bold mb-4">All Clinics</h3>
                <ul>
                  {clinics.length === 0 && <li className="text-muted-foreground">No clinics found.</li>}
                  {clinics.map((clinic) => (
                    <li
                      key={clinic._id}
                      className={`p-2 rounded cursor-pointer mb-2 ${selectedClinic && selectedClinic._id === clinic._id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                      onClick={() => handleSelectClinic(clinic)}
                    >
                      <div className="font-medium">{clinic.clinicName || clinic.fullName}</div>
                      <div className="text-xs text-muted-foreground">{clinic.email}</div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Chat window */}
              <div className="flex-1 flex flex-col">
                {selectedClinic ? (
                  <>
                    <div className="border-b p-4 bg-background flex items-center">
                      <div className="font-bold text-lg">{selectedClinic.clinicName || selectedClinic.fullName}</div>
                      <div className="ml-2 text-xs text-muted-foreground">{selectedClinic.email}</div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-background">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <>
                          {messages.length === 0 && (
                            <div className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</div>
                          )}
                          {messages.map((msg) => (
                            <div key={msg._id} className={`mb-2 flex ${msg.sender && user && msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.sender && user && msg.sender._id === user._id ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                                <div className="text-sm">{msg.text}</div>
                                <div className="text-xs text-muted-foreground text-right mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                  {msg.sender && user && msg.sender._id === user._id && (
                                    <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {typingStatus && (
                            <div className="text-xs text-muted-foreground italic mt-2">{typingStatus}</div>
                          )}
                          <div ref={chatEndRef} />
                        </>
                      )}
                    </div>
                    <div className="p-4 border-t bg-background flex gap-2">
                      <input
                        className="flex-1 border rounded px-3 py-2"
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                      />
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim() || isLoading}>Send</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a clinic to start a conversation.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <div className="mb-4 w-full overflow-x-auto">
                <TabsList className="flex flex-wrap gap-1 w-full">
                  <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
                  <TabsTrigger value="pets" className="flex-shrink-0">My Pets</TabsTrigger>
                  <TabsTrigger value="appointments" className="flex-shrink-0">Appointments</TabsTrigger>
                  <TabsTrigger value="hospitalizations" className="flex-shrink-0">Hospitalizations</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="flex-shrink-0">Prescriptions</TabsTrigger>
                  <TabsTrigger value="medical-records" className="flex-shrink-0">Medical Records</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">My Pets</CardTitle>
                      <Image src="/peteat-logo.png" alt="PetEat Logo" width={16} height={16} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.pets.length}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Registered pets</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Upcoming Appointments</CardTitle>
                      <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingAppointments.length}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {inPersonAppointments.filter(apt => apt.status === 'scheduled').length} in-person • {videoAppointments.filter(apt => apt.status === 'scheduled').length} video
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Active Prescriptions</CardTitle>
                      <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.prescriptions.length}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Current medications</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Recent Appointments & Consultations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.appointments.slice(0, 3).map((appointment) => (
                          <div key={appointment._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {appointment.type === 'consultation' ? 'Video Consultation' : 'Appointment'}
                                {appointment.doctor ? ` with ${appointment.doctor.name}` : ''}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                                {new Date(appointment.startTime).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={
                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                              {appointment.type === 'consultation' && (
                                <Badge variant="outline" className="border-blue-200 text-blue-800">
                                  Video
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {dashboardData.appointments.length === 0 && (
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
                            Start Video Consultation
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
                  {dashboardData.pets.map((pet) => (
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
                  {dashboardData.pets.length === 0 && (
                    <div className="col-span-3 text-center py-8">
                      <p className="text-gray-500">You don't have any pets yet.</p>
                      <p className="text-gray-500">Click "Add Pet" to register your first pet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="appointments" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Appointments</h2>
                  <Link href="/dashboard/user/schedule-appointment">
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule New
                    </Button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {inPersonAppointments.map((appointment) => (
                    <Card key={appointment._id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Appointment{appointment.doctor ? ` with ${appointment.doctor.name}` : ''}</h3>
                              <Badge className={
                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{appointment.doctor ? appointment.doctor.email : null}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(appointment.startTime).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(appointment.startTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                </div>
              </TabsContent>

              <TabsContent value="hospitalizations" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Hospitalizations</h2>
                </div>
                <div className="space-y-4">
                  {dashboardData.petsUnderTreatment.map((treatment) => (
                    <Card key={treatment._id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{treatment.pet.name}</h3>
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
                              <p className="text-sm text-gray-600">{treatment.pet.breed} • {treatment.pet.age} years</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Clinic</p>
                                <p className="font-medium">{treatment.clinic.name}</p>
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
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              Message Clinic
                            </Button>
                            <Button size="sm" onClick={() => { setSelectedTreatment(treatment); setIsTreatmentDialogOpen(true); }}>
                               <FileText className="h-3.5 w-3.5 mr-1.5" />
                               View Details
                             </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {dashboardData.petsUnderTreatment.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">None of your pets are currently under treatment</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Prescriptions</h2>
                </div>
                <div className="space-y-4">
                  {dashboardData.prescriptions.map((prescription) => (
                    <Card key={prescription._id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">Pet: {prescription.pet?.name || 'N/A'}</h3>
                            <p className="text-gray-600">Medicine: {prescription.medicine.item}</p>
                            <p className="text-sm text-gray-500">Date: {new Date(prescription.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {dashboardData.prescriptions.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No prescriptions found</p>
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
                  ) : emrs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No medical records found</p>
                    </div>
                  ) : (
                    emrs.map((emr) => (
                      <Card key={emr._id}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              {emr.petId?.name || emr.name || "Unknown Pet"} - {emr.currentVisit?.date ? new Date(emr.currentVisit.date).toLocaleDateString() : new Date(emr.createdAt).toLocaleDateString()}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {emr.recordType === 'petMedicalRecord' && (
                                <Badge variant="outline">Vet Clinic Record</Badge>
                              )}
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
                          </div>
                          <CardDescription>
                            {emr.breed || "N/A"} • {emr.species || "N/A"} • {emr.age || "N/A"} years old
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Created:</strong> {new Date(emr.createdAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Doctor/Vet:</strong> {emr.doctor?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              {emr.currentVisit?.diagnosis && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Diagnosis:</strong> {emr.currentVisit.diagnosis}
                                </p>
                              )}
                              {emr.currentVisit?.treatment && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Treatment:</strong> {emr.currentVisit.treatment}
                                </p>
                              )}
                              {emr.currentVisit?.notes && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Notes:</strong> {emr.currentVisit.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
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
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Prescription Details</h2>
            <p><strong>Pet:</strong> {selectedPrescription.pet.name}</p>
            <p><strong>Medicine:</strong> {selectedPrescription.medicine.item}</p>
            <p><strong>Doctor:</strong> {selectedPrescription.doctor.name}</p>
            <p><strong>Description:</strong> {selectedPrescription.description}</p>
            <p><strong>Date:</strong> {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
            <Button className="mt-4" onClick={() => setSelectedPrescription(null)}>Close</Button>
          </div>
        </div>
      )}

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
                  <li>All appointments and prescriptions will be deleted</li>
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
