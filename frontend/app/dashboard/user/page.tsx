"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSocket } from "@/app/context/SocketContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Heart, Plus, Video, FileText, Clock, User, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EMRViewer } from "@/components/EMRViewer"

interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  color: string;
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

interface DashboardData {
  pets: Pet[];
  appointments: Appointment[];
  prescriptions: Prescription[];
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pets: [],
    appointments: [],
    prescriptions: []
  })
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { socket } = useSocket();

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        fetchDashboardData(parsedUser._id)
      } catch (e) {
        console.error('Error parsing user data:', e)
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
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
    return () => {
      socket.off("pets_updated", handleRealtimeUpdate);
      socket.off("appointments_updated", handleRealtimeUpdate);
      socket.off("prescriptions_updated", handleRealtimeUpdate);
    };
  }, [socket, user]);

  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        setError('Authentication token not found')
        router.push("/login")
        return
      }

      const response = await fetch(`http://localhost:8080/api/users/${userId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
      } else {
        setError(result.message || 'Failed to fetch dashboard data')
      }
    } catch (error) {
      setError('Failed to fetch dashboard data. Please try again.')
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

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

  const upcomingAppointments = dashboardData.appointments.filter(
    apt => apt.status === 'scheduled'
  )

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
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
  Welcome back, {user?.name || user?.username || 'User'}!
</h1>
          <p className="text-gray-600">Manage your pets and appointments</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pets">My Pets</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Pets</CardTitle>
                  <Image src="/peteat-logo.png" alt="PetEat Logo" width={16} height={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.pets.length}</div>
                  <p className="text-xs text-muted-foreground">Registered pets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Scheduled appointments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.prescriptions.length}</div>
                  <p className="text-xs text-muted-foreground">Current medications</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Appointment with {appointment.doctor.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                            {new Date(appointment.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
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
                  {upcomingAppointments.length > 0 && (
                    <Link href={`/dashboard/user/video-consultation?appointment=${upcomingAppointments[0]._id}`}>
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
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              </Link>
            </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.pets.map((pet) => (
                <Card key={pet._id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
                      </div>
                      <div>
                        <CardTitle>{pet.name}</CardTitle>
                        <CardDescription>{pet.breed}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Age:</strong> {pet.age} years
                      </p>
                      <p>
                        <strong>Weight:</strong> {pet.weight} kg
                      </p>
                      <p>
                        <strong>Color:</strong> {pet.color}
                      </p>
                      <Button className="mt-2" variant="outline" onClick={() => setSelectedPetId(pet._id)}>
                        View EMR
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {selectedPetId && (
  <div
    className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
    onClick={() => setSelectedPetId(null)}
    style={{ zIndex: 1000 }}
  >
    <div
      className="bg-white rounded-lg shadow-lg max-w-2xl w-full relative"
      onClick={e => e.stopPropagation()}
    >
      <EMRViewer emrId={selectedPetId} isOpen={true} onClose={() => setSelectedPetId(null)} />
    </div>
  </div>
)}
              {dashboardData.pets.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 mb-4">No pets registered yet</p>
                  <Link href="/dashboard/user/add-pet">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Pet
                    </Button>
                  </Link>
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
              {dashboardData.appointments.map((appointment) => (
                <Card key={appointment._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Appointment with {appointment.doctor.name}</h3>
                          <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{appointment.doctor.email}</p>
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
                      {appointment.status === "scheduled" && (
                        <div className="flex gap-2">
                          <Link href={`/dashboard/user/video-consultation?appointment=${appointment._id}`}>
                            <Button size="sm">
                              <Video className="h-4 w-4 mr-2" />
                              Join Call
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dashboardData.appointments.length === 0 && (
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
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-6">
            <h2 className="text-2xl font-bold">Prescriptions</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : Array.isArray(dashboardData.prescriptions) && dashboardData.prescriptions.length > 0 ? (
                dashboardData.prescriptions.map((prescription) => (
                  <Card key={prescription._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{prescription.medicine.item}</h3>
                          <p className="text-gray-600">For: {prescription.pet.name}</p>
                          <p className="text-sm text-gray-500">Description: {prescription.description}</p>
                          <p className="text-sm text-gray-500">Prescribed by: {prescription.doctor.name}</p>
                          <p className="text-sm text-gray-500">
                            Date: {new Date(prescription.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No prescriptions available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <h2 className="text-2xl font-bold">Schedule Appointment</h2>
            <Link href="/dashboard/user/schedule-appointment">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">Book New Appointment</h3>
                  <p className="text-gray-600">Schedule a visit with our veterinarians</p>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
