"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Heart, Users, Stethoscope, Package, LogOut, Plus, Edit, Trash2, Sun, Moon, Minus } from "lucide-react"
import Image from "next/image"
import dynamic from 'next/dynamic';
import { AddItemDialog } from "@/components/AddItemDialog"
import { EditUserDialog } from "@/components/EditUserDialog"
import { EditPetDialog } from "@/components/EditPetDialog"
import { UserPermissionsDialog } from "@/components/UserPermissionsDialog"
import { EditInventoryItemDialog } from "@/components/EditInventoryItemDialog"
import { toast, useToast } from "@/components/ui/use-toast"
import React from "react"
import { DashboardSkeleton } from "@/components/DashboardSkeleton"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useSocket } from "@/app/context/SocketContext";
import { Suspense } from 'react';

interface DashboardData {
  totalUsers: number;
  totalDoctors: number;
  availableDoctors: number;
  totalPets: number;
  totalInventory: number;
  lowStockItems: number;
  // Add analytics fields for in-depth inventory analytics
  inventoryChangesByMonth?: { expired: number[]; subtracted: number[]; added: number[]; removed: number[] };
  topSubtractedItems?: { item: string; amount: number }[];
  mostSubtractedCategory?: string;
  mostSubtractedAmount?: number;
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
  category?: string;
  species?: string;
}

interface InventoryItem {
  _id: string;
  item: string;
  category: string;
  stock: number;
  minStock: number;
  status: string;
  expirationDate?: string;
  manufacturingDate?: string;
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
  const [isUpdatingStock, setIsUpdatingStock] = useState<Record<string, boolean>>({})
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [inventoryExpiration, setInventoryExpiration] = useState('all'); // 'all', 'soon', 'expired'
  const [inventoryManufacturing, setInventoryManufacturing] = useState('all'); // 'all', 'last30', 'range'
  const [manufacturingFrom, setManufacturingFrom] = useState('');
  const [manufacturingTo, setManufacturingTo] = useState('');
  const [isAddInventoryDialogOpen, setIsAddInventoryDialogOpen] = useState(false);
  const [newInventoryItem, setNewInventoryItem] = useState({
    item: '',
    category: 'Medication',
    stock: 0,
    minStock: 1,
    status: 'in-stock',
    expirationDate: '',
    manufacturingDate: ''
  });
  const [inventoryExpiryMonth, setInventoryExpiryMonth] = useState('');
  const [inventoryManufacturingMonth, setInventoryManufacturingMonth] = useState('');
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2019 + 2 }, (_, i) => 2020 + i); // 2020 to currentYear+1
  const [inventoryAnalyticsYear, setInventoryAnalyticsYear] = useState<number>(currentYear);
  
  const router = useRouter()
  const { dismiss } = useToast();
  const { socket } = useSocket();

  // Add state for user and pet search
  const [userSearch, setUserSearch] = useState('');
  const [petSearch, setPetSearch] = useState('');

  // Add pagination state
  const [userPage, setUserPage] = useState(1);
  const [petPage, setPetPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const pageSize = 20;

  // Memoize expensive calculations
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.status === 'low-stock' || item.stock <= item.minStock);
  }, [inventory]);

  const recentUsers = useMemo(() => {
    return users.slice(0, 5); // Show only 5 most recent users
  }, [users]);

  const recentPets = useMemo(() => {
    return pets.slice(0, 5); // Show only 5 most recent pets
  }, [pets]);

  // Memoize callback functions
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
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

      // Add year, page, and limit params to endpoint
      let url = `http://localhost:8080/api/admin/dashboard/all-data?year=${inventoryAnalyticsYear}`;
      url += `&page=${userPage}`;
      url += `&limit=${pageSize}`;
      // Use the new optimized endpoint that returns all data in one request
      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()

      // Merge analytics fields into dashboardData for DashboardAnalytics
      setDashboardData({
        ...data.data.overview,
        ...data.data,
        inventoryItems: data.data.overview.inventoryCount ?? data.data.overview.totalInventory ?? 0 // ensure the correct field is mapped
      })
      setUsers(data.data.users)
      setPets(data.data.pets)
      setInventory(data.data.inventory)
      setRecentActivities(data.data.activities)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [inventoryAnalyticsYear, userPage]);

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
  }, [router, fetchDashboardData])

  // Remove setInterval polling, use socket events for real-time updates
  useEffect(() => {
    fetchDashboardData();
  }, [inventoryAnalyticsYear]);

  useEffect(() => {
    if (!socket) return;
    const handleInventoryUpdated = () => {
      fetchDashboardData();
    };
    socket.on('inventory_updated', handleInventoryUpdated);
    return () => {
      socket.off('inventory_updated', handleInventoryUpdated);
    };
  }, [socket, fetchDashboardData]);

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

  const handleAddInventoryItem = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('http://localhost:8080/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newInventoryItem)
      });
      if (!response.ok) throw new Error('Failed to add inventory item');
      const created = await response.json();
      setInventory(prev => [...prev, created.data]);
      setIsAddInventoryDialogOpen(false);
      setNewInventoryItem({
        item: '',
        category: 'Medication',
        stock: 0,
        minStock: 1,
        status: 'in-stock',
        expirationDate: '',
        manufacturingDate: ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  useEffect(() => {
    return () => {
      dismiss();
    };
  }, [dismiss]);

  // Fix total stock calculation for analytics
  const totalStock = useMemo(() => inventory.reduce((sum, item) => sum + (item.stock || 0), 0), [inventory]);

  // Unify category dropdown
  const categoryOptions = [
    'Medication',
    'Supplies',
    'Equipment',
    'Food',
    'Vaccine'
  ];

  // Add or update filteredInventory logic to include search
  const filteredInventory = useMemo(() => {
    let items = inventory || [];
    if (inventoryCategory) {
      items = items.filter(item => item.category === inventoryCategory);
    }
    if (inventoryStatus) {
      items = items.filter(item => item.status === inventoryStatus);
    }
    if (inventoryExpiryMonth) {
      items = items.filter(item => {
        if (!item.expirationDate) return false;
        const date = new Date(item.expirationDate);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        const [selectedYear, selectedMonth] = inventoryExpiryMonth.split('-');
        return year === selectedYear && month === selectedMonth;
      });
    }
    if (inventoryManufacturingMonth) {
      items = items.filter(item => {
        if (!item.manufacturingDate) return false;
        const date = new Date(item.manufacturingDate);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        const [selectedYear, selectedMonth] = inventoryManufacturingMonth.split('-');
        return year === selectedYear && month === selectedMonth;
      });
    }
    if (inventorySearch.trim() !== "") {
      const q = inventorySearch.toLowerCase();
      items = items.filter(item =>
        item.item.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.status && item.status.toLowerCase().includes(q))
      );
    }
    return items;
  }, [inventory, inventoryCategory, inventoryStatus, inventoryExpiryMonth, inventoryManufacturingMonth, inventorySearch]);

  // Add a useEffect to refetch inventory analytics when the year changes
  useEffect(() => {
    // You may need to update your fetch logic to accept a year param
    fetchDashboardData();
  }, [inventoryAnalyticsYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardSkeleton />
          </div>
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
            {/* Prominent Analytics Section */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="analytics-year" className="text-sm font-medium text-gray-700 dark:text-gray-200">Analytics Year:</label>
                  <select
                    id="analytics-year"
                    value={inventoryAnalyticsYear}
                    onChange={e => setInventoryAnalyticsYear(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                  Refresh Analytics
                </Button>
              </CardHeader>
              <CardContent>
                {dashboardData && (
                  <DashboardAnalytics
                    data={dashboardData}
                    analyticsYear={inventoryAnalyticsYear}
                    setAnalyticsYear={setInventoryAnalyticsYear}
                    currentYear={currentYear}
                    showAppointmentsByReason={false}
                    showPetStatusChanges={false}
                    showPetsAdmitted={false}
                    showPetHealthStatus={false}
                  />
                )}
              </CardContent>
            </Card>

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
                          <TableCell className="font-medium text-gray-900 dark:text-white">{user.username}</TableCell>
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
                            <Badge variant={
                              item.status === 'in-stock' ? 'default' :
                              item.status === 'low-stock' ? 'secondary' :
                              'destructive'
                            }>
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
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
              <Input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-64"
              />
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
                  {(users || []).filter(user => {
                    const q = userSearch.toLowerCase();
                    return (
                      (user.username || '').toLowerCase().includes(q) ||
                      (user.email || '').toLowerCase().includes(q) ||
                      (user.role || '').toLowerCase().includes(q)
                    );
                  }).map((user) => (
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
              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}>Previous</Button>
                <span>Page {userPage}</span>
                <Button onClick={() => setUserPage(p => p + 1)} disabled={users.length < pageSize}>Next</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="pets" className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pets</h2>
              <Input
                type="text"
                placeholder="Search pets..."
                value={petSearch}
                onChange={e => setPetSearch(e.target.value)}
                className="w-64"
              />
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
                  {(pets || []).filter(pet => {
                    const q = petSearch.toLowerCase();
                    return (
                      pet.name.toLowerCase().includes(q) ||
                      (pet.category && pet.category.toLowerCase().includes(q)) ||
                      (pet.species && pet.species.toLowerCase().includes(q)) ||
                      (pet.breed && pet.breed.toLowerCase().includes(q)) ||
                      (typeof pet.owner === 'object' && pet.owner && (
                        (pet.owner.fullName && pet.owner.fullName.toLowerCase().includes(q)) ||
                        (pet.owner.username && pet.owner.username.toLowerCase().includes(q)) ||
                        (pet.owner.email && pet.owner.email.toLowerCase().includes(q))
                      ))
                    );
                  }).map((pet) => (
                    <TableRow key={pet._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-white">{pet.name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{pet.category || pet.species || pet.type || 'N/A'}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{pet.breed}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {typeof pet.owner === 'object' && pet.owner ? (pet.owner.fullName || pet.owner.username || pet.owner.email || 'N/A') : (pet.owner || 'N/A')}
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
              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setPetPage(p => Math.max(1, p - 1))} disabled={petPage === 1}>Previous</Button>
                <span>Page {petPage}</span>
                <Button onClick={() => setPetPage(p => p + 1)} disabled={pets.length < pageSize}>Next</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-wrap gap-2 items-end mb-4">
              <div>
                <label htmlFor="inventoryAnalyticsYear" className="mr-2 font-medium">Inventory Analytics Year:</label>
                <input
                  id="inventoryAnalyticsYear"
                  type="number"
                  min="2000"
                  max={currentYear + 10}
                  value={inventoryAnalyticsYear}
                  onChange={e => setInventoryAnalyticsYear(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
              <div>
                <label>Category</label>
                <select className="border rounded px-2 py-1" value={inventoryCategory} onChange={e => setInventoryCategory(e.target.value)}>
                  <option value="">All</option>
                  {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label>Status</label>
                <select className="border rounded px-2 py-1" value={inventoryStatus} onChange={e => setInventoryStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label>Search</label>
                <Input placeholder="Search item..." value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
              </div>
              <div>
                <label htmlFor="inventoryExpiryMonth" className="mr-2 font-medium">Inventory Expiry Month:</label>
                <input
                  id="inventoryExpiryMonth"
                  type="month"
                  value={inventoryExpiryMonth}
                  onChange={e => setInventoryExpiryMonth(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="inventoryManufacturingMonth" className="mr-2 font-medium">Manufacturing Month:</label>
                <input
                  id="inventoryManufacturingMonth"
                  type="month"
                  value={inventoryManufacturingMonth}
                  onChange={e => setInventoryManufacturingMonth(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <Button onClick={() => setIsAddInventoryDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            {/* Show a message if no data for the year */}
            {inventory.length === 0 && (
              <div className="text-center text-gray-500 text-lg py-12">No data for this year.</div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Manufacturing Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory
                  .filter(item => item.item.toLowerCase().includes(inventorySearch.toLowerCase()))
                  .filter(item => {
                    let matchesManufacturing = true;
                    if (inventoryManufacturing === 'last30') {
                      if (!item.manufacturingDate) return false;
                      const days = (Number(new Date()) - Number(new Date(item.manufacturingDate))) / (1000*60*60*24);
                      matchesManufacturing = days >= 0 && days <= 30;
                    } else if (inventoryManufacturing === 'range') {
                      if (!item.manufacturingDate) return false;
                      const date = new Date(item.manufacturingDate);
                      if (manufacturingFrom && date < new Date(manufacturingFrom)) matchesManufacturing = false;
                      if (manufacturingTo && date > new Date(manufacturingTo)) matchesManufacturing = false;
                    }
                    return matchesManufacturing;
                  })
                  .map(item => {
                    let expClass = '';
                    if (item.expirationDate) {
                      const days = (Number(new Date(item.expirationDate)) - Number(new Date())) / (1000*60*60*24);
                      if (days >= 0 && days <= 7) expClass = 'bg-yellow-100 text-yellow-800';
                      if (days < 0) expClass = 'bg-red-100 text-red-800';
                    }
                    return (
                      <TableRow key={item._id} className={expClass}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{item.manufacturingDate ? new Date(item.manufacturingDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedInventoryItem(item); setIsEditInventoryItemDialogOpen(true); }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteInventoryItem(item._id)} className="ml-2">Delete</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1}>Previous</Button>
              <span>Page {inventoryPage}</span>
              <Button onClick={() => setInventoryPage(p => p + 1)} disabled={inventory.length < pageSize}>Next</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        {isAddItemDialogOpen && (
          <AddItemDialog
            isOpen={isAddItemDialogOpen}
            onClose={() => setIsAddItemDialogOpen(false)}
            onAddItem={handleAddItem}
          />
        )}
        {isEditUserDialogOpen && (
          <EditUserDialog
            isOpen={isEditUserDialogOpen}
            onClose={() => setIsEditUserDialogOpen(false)}
            user={selectedUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {isEditPetDialogOpen && (
          <EditPetDialog
            isOpen={isEditPetDialogOpen}
            onClose={() => setIsEditPetDialogOpen(false)}
            onUpdatePet={handleUpdatePet}
            pet={selectedPet}
          />
        )}
        {isUserPermissionsDialogOpen && (
          <UserPermissionsDialog
            isOpen={isUserPermissionsDialogOpen}
            onClose={() => setIsUserPermissionsDialogOpen(false)}
          />
        )}
        {selectedInventoryItem && isEditInventoryItemDialogOpen && (
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
      </Suspense>
      <Dialog open={isAddInventoryDialogOpen} onOpenChange={setIsAddInventoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item">Item Name</Label>
              <Input id="item" value={newInventoryItem.item} onChange={e => setNewInventoryItem({ ...newInventoryItem, item: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" className="w-full px-3 py-2 border rounded-md" value={newInventoryItem.category} onChange={e => setNewInventoryItem({ ...newInventoryItem, category: e.target.value })}>
                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={newInventoryItem.stock} onChange={e => setNewInventoryItem({ ...newInventoryItem, stock: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input id="minStock" type="number" value={newInventoryItem.minStock} onChange={e => setNewInventoryItem({ ...newInventoryItem, minStock: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input id="expirationDate" type="date" value={newInventoryItem.expirationDate} onChange={e => setNewInventoryItem({ ...newInventoryItem, expirationDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
              <Input id="manufacturingDate" type="date" value={newInventoryItem.manufacturingDate} onChange={e => setNewInventoryItem({ ...newInventoryItem, manufacturingDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddInventoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInventoryItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
