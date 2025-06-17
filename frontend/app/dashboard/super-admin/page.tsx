"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminManagement from "@/components/super-admin/AdminManagement"
import DoctorManagement from "@/components/super-admin/DoctorManagement"
import UserManagement from "@/components/super-admin/UserManagement"
import PetManagement from "@/components/super-admin/PetManagement"
import InventoryManagement from "@/components/super-admin/InventoryManagement"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import VetClinicApproval from '@/components/super-admin/VetClinicApproval'

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('admins')
  const [admins, setAdmins] = useState([])
  const [doctors, setDoctors] = useState([])
  const [users, setUsers] = useState([])
  const [pets, setPets] = useState([])
  const [inventory, setInventory] = useState([])
  const router = useRouter()
  const { toast } = useToast()

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

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setDoctors(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
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

  useEffect(() => {
    fetchAdmins()
    fetchDoctors()
    fetchUsers()
    fetchPets()
    fetchInventory()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`${
                    activeTab === 'admins'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Admin Management
                </button>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className={`${
                    activeTab === 'doctors'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Doctor Management
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
              {activeTab === 'doctors' && <DoctorManagement doctors={doctors} onDoctorUpdated={fetchDoctors} />}
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