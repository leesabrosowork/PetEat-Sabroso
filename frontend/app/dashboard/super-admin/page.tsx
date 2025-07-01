"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminManagement from "@/components/super-admin/AdminManagement"
import UserManagement from "@/components/super-admin/UserManagement"
import PetManagement from "@/components/super-admin/PetManagement"
import InventoryManagement from "@/components/super-admin/InventoryManagement"
import { Button } from "@/components/ui/button"
import { LogOut, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import VetClinicApproval from '@/components/super-admin/VetClinicApproval'
import { DashboardAnalytics } from '@/components/DashboardAnalytics'

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('admins')
  const [admins, setAdmins] = useState([])
  const [users, setUsers] = useState([])
  const [pets, setPets] = useState([])
  const [inventory, setInventory] = useState([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const router = useRouter()
  const { toast, dismiss } = useToast()
  const [darkMode, setDarkMode] = useState(false)

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    })
  }

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setAdmins(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/pets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setPets(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch pets:", error)
    }
  }

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/inventory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setInventory(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    }
  }

  const fetchDashboardOverview = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/super-admin/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDashboardData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error)
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchUsers()
    fetchPets()
    fetchInventory()
    fetchDashboardOverview()
  }, [])

  useEffect(() => {
    return () => {
      dismiss();
    };
  }, [dismiss]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Image
                src="/peteat-logo.png"
                alt="PetEat Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={toggleDarkMode} className="h-10 w-10">
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle dark mode</span>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            {dashboardData && <DashboardAnalytics data={{
              totalUsers: dashboardData.userCount,
              totalPets: dashboardData.petCount,
              inventoryItems: dashboardData.inventoryCount,
              lowStockItems: dashboardData.lowStockItems,
              mostSubtractedCategory: dashboardData.mostSubtractedCategory,
              mostSubtractedAmount: dashboardData.mostSubtractedAmount,
            }} />}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`${
                    activeTab === 'admins'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  Admin Management
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  User Management
                </button>
                <button
                  onClick={() => setActiveTab('pets')}
                  className={`${
                    activeTab === 'pets'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Pet Management
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`${
                    activeTab === 'inventory'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Inventory Management
                </button>
                <button
                  onClick={() => setActiveTab('vet-clinics')}
                  className={`${
                    activeTab === 'vet-clinics'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Vet Clinic Approvals
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'admins' && <AdminManagement admins={admins} onAdminUpdated={fetchAdmins} />}
              {activeTab === 'users' && <UserManagement users={users} onUserUpdated={fetchUsers} />}
              {activeTab === 'pets' && <PetManagement pets={pets} onPetUpdated={fetchPets} />}
              {activeTab === 'inventory' && <InventoryManagement inventory={inventory} onInventoryUpdated={fetchInventory} />}
              {activeTab === 'vet-clinics' && <VetClinicApproval />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 