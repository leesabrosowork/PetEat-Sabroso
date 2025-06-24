"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Heart, Users, Stethoscope, Package, LogOut, Plus, Edit, Trash2, Sun, Moon, Minus } from "lucide-react"
import Image from "next/image"
import { AddItemDialog } from "@/components/AddItemDialog"
import { EditUserDialog } from "@/components/EditUserDialog"
import { EditPetDialog } from "@/components/EditPetDialog"
import { UserPermissionsDialog } from "@/components/UserPermissionsDialog"
import { EditInventoryItemDialog } from "@/components/EditInventoryItemDialog"
import { toast } from "@/components/ui/use-toast"

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
  const [pets, setPets] = useState<Pet[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditPetDialogOpen, setIsEditPetDialogOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [isUserPermissionsDialogOpen, setIsUserPermissionsDialogOpen] = useState(false)
  const [isEditInventoryItemDialogOpen, setIsEditInventoryItemDialogOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)
  
  const handleAddNewItem = () => {
    // Create a new empty item
    const newItem: Partial<InventoryItem> = {
      _id: 'new', // Temporary ID that will be replaced by the server
      item: '',
      category: 'Medication', // Default category
      stock: 0,
      minStock: 1,
      status: 'in-stock'
    };
    
    setSelectedInventoryItem(newItem as InventoryItem);
    setIsEditInventoryItemDialogOpen(true);
  };
  const [isUpdatingStock, setIsUpdatingStock] = useState<Record<string, boolean>>({})
  
  const router = useRouter()

  const updateStock = async (itemId: string, change: number) => {
    try {
      setIsUpdatingStock(prev => ({ ...prev, [itemId]: true }))
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`http://localhost:8080/api/admin/inventory/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ change })
      })

      if (!response.ok) throw new Error('Failed to update stock')
      
      // Update local state
      setInventory(prev => prev.map(item => 
        item._id === itemId 
          ? { 
              ...item, 
              stock: Math.max(0, item.stock + change), // Prevent negative stock
              status: item.minStock >= (item.stock + change) ? 'Low' : 'In Stock'
            } 
          : item
      ))
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStock(prev => ({ ...prev, [itemId]: false }))
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchDashboardData()
    } else {
      router.push("/login")
    }
  }, [router])

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
        petsRes,
        inventoryRes,
        activitiesRes
      ] = await Promise.all([
        fetch('http://localhost:8080/api/admin/dashboard/overview', { headers }),
        fetch('http://localhost:8080/api/admin/users', { headers }),
        fetch('http://localhost:8080/api/admin/pets', { headers }),
        fetch('http://localhost:8080/api/admin/inventory', { headers }),
        fetch('http://localhost:8080/api/admin/recent-activities', { headers })
      ])

      // Check if any request failed
      if (!overviewRes.ok || !usersRes.ok || !petsRes.ok || !inventoryRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      // Parse all responses
      const [
        overviewData,
        usersData,
        petsData,
        inventoryData,
        activitiesData
      ] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        petsRes.json(),
        inventoryRes.json(),
        activitiesRes.json()
      ])

      // Update state with fetched data
      setDashboardData(overviewData.data)
      setUsers(usersData.data)
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
      console.log('Saving inventory item:', updatedItem);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Create a clean object with only the fields we want to save
      const itemData = {
        item: updatedItem.item,
        category: updatedItem.category,
        stock: Number(updatedItem.stock) || 0,
        minStock: Number(updatedItem.minStock) || 1,
        status: updatedItem.status || 'in-stock'
      };

      console.log('Saving item with data:', itemData);
      
      // Determine if this is a new item or an update
      const isNewItem = updatedItem._id === 'new' || !updatedItem._id;
      const url = isNewItem 
        ? `http://localhost:8080/api/admin/inventory`
        : `http://localhost:8080/api/admin/inventory/${updatedItem._id}`;
      
      const response = await fetch(url, {
        method: isNewItem ? 'POST' : 'PUT',
        headers,
        body: JSON.stringify(itemData)
      });

      const responseData = await response.json();
      console.log('Save response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${isNewItem ? 'create' : 'update'} inventory item`);
      }

      // Update the inventory with the new/updated item
      if (isNewItem) {
        // Add the new item to the inventory
        setInventory(prevInventory => [...prevInventory, responseData.data]);
      } else {
        // Update the existing item
        setInventory(prevInventory => 
          prevInventory.map(item => 
            item._id === updatedItem._id ? { ...responseData.data } : item
          )
        );
      }
      
      setIsEditInventoryItemDialogOpen(false);
      setSelectedInventoryItem(null);
      
      toast({
        title: 'Success',
        description: `Inventory item ${isNewItem ? 'added' : 'updated'} successfully`,
        variant: 'default'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the inventory item';
      console.error('Error updating inventory item:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!itemId) {
      console.error('Cannot delete item: No item ID provided');
      toast({
        title: 'Error',
        description: 'Cannot delete item: No item ID provided',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      console.log('Deleting inventory item with ID:', itemId);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Sending delete request for item ID:', itemId);
      const response = await fetch(`http://localhost:8080/api/admin/inventory/${itemId}`, {
        method: 'DELETE',
        headers: headers
      });

      console.log('Delete response status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Delete response data:', responseData);
      } catch (e) {
        console.error('Failed to parse delete response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete inventory item');
      }

      // Update the UI by removing the deleted item
      setInventory(prevInventory => prevInventory.filter(item => item._id !== itemId));
      
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the inventory item';
      console.error('Error deleting inventory item:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/peteat-logo.png" alt="PetEat Logo" width={24} height={24} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">PetEat - Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  const html = document.documentElement
                  const isDark = html.classList.contains('dark')
                  if (isDark) {
                    html.classList.remove('dark')
                    localStorage.setItem('theme', 'light')
                  } else {
                    html.classList.add('dark')
                    localStorage.setItem('theme', 'dark')
                  }
                }}
                className="ml-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="pets" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Pets
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.totalUsers}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active users</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Pets</CardTitle>
                  <Heart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.totalPets}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Registered pets</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Inventory</CardTitle>
                  <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData?.totalInventory}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{dashboardData?.lowStockItems} low stock items</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentActivities?.recentUsers || []).slice(0, 5).map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell className="text-gray-900 dark:text-white">{user.username}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{user.email}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{user.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 dark:text-white">Item</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Category</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Stock</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentActivities?.inventoryAlerts || []).slice(0, 5).map((item) => (
                        <TableRow key={item._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableCell className="text-gray-900 dark:text-white">{item.item}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{item.category}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateStock(item._id, -1)}
                                disabled={isUpdatingStock[item._id] || item.stock <= 0}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.stock}</span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateStock(item._id, 1)}
                                disabled={isUpdatingStock[item._id]}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              {isUpdatingStock[item._id] && (
                                <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'Low' ? 'destructive' : 'default'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
              <Button onClick={() => setIsAddItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Role</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-white">{user.username}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.email}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{user.role}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditUserDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="pets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pets</h2>
              <Button onClick={() => setIsEditPetDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Type</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Breed</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Owner</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pets.map((pet) => (
                    <TableRow key={pet._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-white">{pet.name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{pet.type}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{pet.breed}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {typeof pet.owner === 'object' && pet.owner ? (pet.owner.username || pet.owner.email || 'N/A') : (pet.owner || 'N/A')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPet(pet);
                              setIsEditPetDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePet(pet._id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory</h2>
              <Button onClick={handleAddNewItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 dark:text-white">Item</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Category</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Stock</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Min Stock</TableHead>
                    <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                    <TableHead className="text-right text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-white">{item.item}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{item.category}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{item.stock}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{item.minStock}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Low' ? 'destructive' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setIsEditInventoryItemDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInventoryItem(item._id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddItemDialog
        isOpen={isAddItemDialogOpen}
        onClose={() => setIsAddItemDialogOpen(false)}
        onAddItem={handleAddItem}
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
      {selectedInventoryItem && (
        <EditInventoryItemDialog
          isOpen={isEditInventoryItemDialogOpen}
          onClose={() => {
            setIsEditInventoryItemDialogOpen(false);
            setSelectedInventoryItem(null);
          }}
          onUpdateInventoryItem={handleUpdateInventoryItem}
          item={selectedInventoryItem}
        />
      )}
    </div>
  );
}
