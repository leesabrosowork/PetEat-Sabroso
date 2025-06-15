"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Heart, Users, Stethoscope, Package, LogOut, Plus, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { AddItemDialog } from "@/components/AddItemDialog"
import { EditUserDialog } from "@/components/EditUserDialog"
import { EditDoctorDialog } from "@/components/EditDoctorDialog"
import { EditPetDialog } from "@/components/EditPetDialog"
import { UserPermissionsDialog } from "@/components/UserPermissionsDialog"
import { EditInventoryItemDialog } from "@/components/EditInventoryItemDialog"
import { AddDoctorDialog } from "@/components/AddDoctorDialog"

interface DashboardData {
  totalUsers: number;
  totalDoctors: number;
  availableDoctors: number;
  totalPets: number;
  totalInventory: number;
  lowStockItems: number;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  status: string;
}

interface Doctor {
  _id?: string;
  name: string;
  email: string;
  password: string;
  contact: string;
  address: string;
  specialty: string;
  availability: 'available' | 'busy';
}

interface PetOwner {
  username?: string;
  email?: string;
  [key: string]: any; // Allow extra fields for robustness
}

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  owner: PetOwner | string;
}

interface InventoryItem {
  _id: string;
  item: string;
  category: string;
  stock: number;
  minStock: number;
  status: string;
}

interface RecentActivities {
  recentUsers: User[];
  inventoryAlerts: InventoryItem[];
}

export default function AdminDashboard() {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDoctorDialogOpen, setIsEditDoctorDialogOpen] = useState(false)
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isEditPetDialogOpen, setIsEditPetDialogOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [isUserPermissionsDialogOpen, setIsUserPermissionsDialogOpen] = useState(false)
  const [isEditInventoryItemDialogOpen, setIsEditInventoryItemDialogOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchDashboardData()
      fetchSpecialties()
    } else {
      router.push("/login")
    }
  }, [router])

  const fetchSpecialties = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const defaultSpecialties = [
        'General Practitioner',
        'Surgeon',
        'Dermatologist',
        'Cardiologist',
        'Ophthalmologist',
        'Dentist',
        'Radiologist',
        'Neurologist',
        'Oncologist',
        'Exotic Animal Specialist'
      ];
      const res = await fetch('http://localhost:8080/api/admin/doctor-specialties', { headers });
      if (!res.ok) throw new Error('Failed to fetch specialties');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Merge backend specialties with defaults, remove duplicates
        const merged = Array.from(new Set([...defaultSpecialties, ...data.data]));
        setSpecialties(merged);
      } else {
        setSpecialties(defaultSpecialties);
      }
    } catch (error) {
      setSpecialties([]);
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch all data in parallel
      const [
        overviewRes,
        usersRes,
        doctorsRes,
        petsRes,
        inventoryRes,
        activitiesRes
      ] = await Promise.all([
        fetch('http://localhost:8080/api/admin/dashboard/overview', { headers }),
        fetch('http://localhost:8080/api/admin/users', { headers }),
        fetch('http://localhost:8080/api/admin/doctors', { headers }),
        fetch('http://localhost:8080/api/admin/pets', { headers }),
        fetch('http://localhost:8080/api/admin/inventory', { headers }),
        fetch('http://localhost:8080/api/admin/recent-activities', { headers })
      ])

      // Check if any request failed
      if (!overviewRes.ok || !usersRes.ok || !doctorsRes.ok || !petsRes.ok || !inventoryRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      // Parse all responses
      const [
        overviewData,
        usersData,
        doctorsData,
        petsData,
        inventoryData,
        activitiesData
      ] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        doctorsRes.json(),
        petsRes.json(),
        inventoryRes.json(),
        activitiesRes.json()
      ])

      // Update state with fetched data
      setDashboardData(overviewData.data)
      setUsers(usersData.data)
      setDoctors(doctorsData.data)
      setPets(petsData.data)
      setInventory(inventoryData.data)
      setRecentActivities(activitiesData.data)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleAddItem = async (newItem: any) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('http://localhost:8080/api/admin/inventory', {
        method: 'POST',
        headers,
        body: JSON.stringify(newItem)
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      const createdItem = await response.json()
      setInventory([...inventory, createdItem.data])
      setIsAddItemDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error adding item:', error)
    }
  }

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/users/${updatedUser._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedUser)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const returnedUser = await response.json()
      setUsers(users.map(user => user._id === returnedUser.data._id ? returnedUser.data : user))
      setIsEditUserDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(users.filter(user => user._id !== userId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error deleting user:', error)
    }
  }

  const handleUpdateDoctor = async (updatedDoctor: Doctor) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Always send availability as 'available' unless toggled from the table
      const doctorPayload = {
        ...updatedDoctor,
        availability: updatedDoctor.availability || 'available',
      };

      const response = await fetch(`http://localhost:8080/api/admin/doctors/${updatedDoctor._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(doctorPayload),
      })

      if (!response.ok) {
        throw new Error('Failed to update doctor')
      }

      const returnedDoctor = await response.json()
      setDoctors(doctors.map(doctor => doctor._id === returnedDoctor.data._id ? returnedDoctor.data : doctor))
      setIsEditDoctorDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error updating doctor:', error)
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/doctors/${doctorId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to delete doctor')
      }

      setDoctors(doctors.filter(doctor => doctor._id !== doctorId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error deleting doctor:', error)
    }
  }

  const handleUpdatePet = async (updatedPet: Pet) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/pets/${updatedPet._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedPet)
      })

      if (!response.ok) {
        throw new Error('Failed to update pet')
      }

      const returnedPet = await response.json()
      setPets(pets.map(pet => pet._id === returnedPet.data._id ? returnedPet.data : pet))
      setIsEditPetDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error updating pet:', error)
    }
  }

  const handleDeletePet = async (petId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/pets/${petId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to delete pet')
      }

      setPets(pets.filter(pet => pet._id !== petId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error deleting pet:', error)
    }
  }

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/inventory/${updatedItem._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedItem)
      })

      if (!response.ok) {
        throw new Error('Failed to update inventory item')
      }

      const returnedItem = await response.json()
      setInventory(inventory.map(item => item._id === returnedItem.data._id ? returnedItem.data : item))
      setIsEditInventoryItemDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error updating inventory item:', error)
    }
  }

  const handleDeleteInventoryItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`http://localhost:8080/api/admin/inventory/${itemId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to delete inventory item')
      }

      setInventory(inventory.filter(item => item._id !== itemId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error deleting inventory item:', error)
    }
  }

  const handleAddDoctor = async (newDoctor: Doctor) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Always send availability as 'available'
      const doctorPayload = {
        name: newDoctor.name,
        email: newDoctor.email,
        password: newDoctor.password,
        contact: newDoctor.contact,
        address: newDoctor.address,
        specialty: newDoctor.specialty,
        availability: 'available',
      };
      const response = await fetch('http://localhost:8080/api/doctors', {
        method: 'POST',
        headers,
        body: JSON.stringify(doctorPayload),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to add doctor';
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.status)) {
            errorMsg = errorData.message || errorData.status;
          }
        } catch (parseError) {
          // ignore JSON parse error
        }
        throw new Error(errorMsg);
      }

      const createdDoctor = await response.json()
      setDoctors([...doctors, createdDoctor.data])
      setIsAddDoctorDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Error adding doctor:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
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
          <Button onClick={fetchDashboardData}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/peteat-logo.png" alt="PetEat Logo" width={24} height={24} />
            <span className="text-xl font-bold">PetEat - Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user?.username}</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, doctors, pets, and inventory</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="pets">Pets</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalDoctors}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.availableDoctors} available
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registered Pets</CardTitle>
                  <Image src="/peteat-logo.png" alt="PetEat Logo" width={16} height={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalPets}</div>
                  <p className="text-xs text-muted-foreground">Total pets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalInventory}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.lowStockItems} need attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(recentActivities?.recentUsers || []).map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={user.role === "doctor" ? "default" : "secondary"}>{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(recentActivities?.inventoryAlerts || []).map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-gray-600">Stock: {item.stock}</p>
                          <p className="text-sm text-gray-500">Min: {item.minStock}</p>
                        </div>
                        <Badge variant={item.status === "out-of-stock" ? "destructive" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users || []).map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "doctor" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedUser(user)
                              setIsEditUserDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0">
              <h2 className="text-2xl font-bold">Doctor Management</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="specialty-filter" className="text-sm font-medium">Specialty:</label>
                <select
                  id="specialty-filter"
                  className="border rounded px-2 py-1"
                  value={selectedSpecialty}
                  onChange={e => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">All</option>
                  {/* Always use a unique key for each option */}
                  {specialties.map((s, idx) => (
                    <option value={s} key={s + '-' + idx}>{s}</option>
                  ))}
                </select>
                <Button onClick={() => setIsAddDoctorDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Doctor
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Always use a unique key for each doctor row */}
                    {(doctors || []).filter(doctor => !selectedSpecialty || doctor.specialty === selectedSpecialty).map((doctor, idx) => {
                      // Default to 'available' if missing
                      const availability = doctor.availability || 'available';
                      return (
                        <TableRow key={doctor._id || doctor.email + '-' + idx}>
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell>{doctor.specialty}</TableCell>
                          <TableCell>
                            <Badge variant={availability === 'available' ? 'default' : 'destructive'}>
                              {availability === 'available' ? 'Available' : 'Busy'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsEditDoctorDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteDoctor(doctor._id || doctor.email)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pet Management</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Breed</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pets || []).map((pet) => (
                      <TableRow key={pet._id}>
                        <TableCell className="font-medium">{pet.name}</TableCell>
                        <TableCell>{pet.type}</TableCell>
                        <TableCell>{pet.breed}</TableCell>
                        <TableCell>{pet.age}</TableCell>
                        <TableCell>{
                          pet.owner && typeof pet.owner === 'object'
                            ? (pet.owner.username || pet.owner.email || 'Unknown')
                            : (pet.owner || 'Unknown')
                        }</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedPet(pet)
                              setIsEditPetDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeletePet(pet._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              <Button onClick={() => setIsAddItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(inventory || []).map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "in-stock"
                                ? "default"
                                : item.status === "low-stock"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedInventoryItem(item)
                              setIsEditInventoryItemDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteInventoryItem(item._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddItemDialog
        isOpen={isAddItemDialogOpen}
        onClose={() => setIsAddItemDialogOpen(false)}
        onAddItem={handleAddItem}
      />
      <EditDoctorDialog
        isOpen={isEditDoctorDialogOpen}
        onClose={() => setIsEditDoctorDialogOpen(false)}
        doctor={selectedDoctor}
        onUpdateDoctor={handleUpdateDoctor}
      />
      <AddDoctorDialog
        isOpen={isAddDoctorDialogOpen}
        onClose={() => setIsAddDoctorDialogOpen(false)}
        onAddDoctor={handleAddDoctor}
        specialties={specialties}
      />
      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onClose={() => setIsEditUserDialogOpen(false)}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
      />

      <EditPetDialog
        isOpen={isEditPetDialogOpen}
        onClose={() => setIsEditPetDialogOpen(false)}
        onUpdatePet={handleUpdatePet}
        pet={selectedPet}
      />
      <UserPermissionsDialog
        isOpen={isUserPermissionsDialogOpen}
        onClose={() => setIsUserPermissionsDialogOpen(false)}
      />
      <EditInventoryItemDialog
        isOpen={isEditInventoryItemDialogOpen}
        onClose={() => setIsEditInventoryItemDialogOpen(false)}
        onUpdateInventoryItem={handleUpdateInventoryItem}
        item={selectedInventoryItem}
      />
    </div>
  );
}
