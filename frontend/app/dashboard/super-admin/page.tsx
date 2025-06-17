"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminManagement from "@/components/super-admin/AdminManagement"
import DoctorManagement from "@/components/super-admin/DoctorManagement"
import UserManagement from "@/components/super-admin/UserManagement"
import PetManagement from "@/components/super-admin/PetManagement"
import InventoryManagement from "@/components/super-admin/InventoryManagement"

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([])
  const [doctors, setDoctors] = useState([])
  const [users, setUsers] = useState([])
  const [pets, setPets] = useState([])
  const [inventory, setInventory] = useState([])

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>

      <Tabs defaultValue="admins">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <AdminManagement admins={admins} onAdminUpdated={fetchAdmins} />
        </TabsContent>

        <TabsContent value="doctors">
          <DoctorManagement doctors={doctors} onDoctorUpdated={fetchDoctors} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement users={users} onUserUpdated={fetchUsers} />
        </TabsContent>

        <TabsContent value="pets">
          <PetManagement pets={pets} onPetUpdated={fetchPets} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement inventory={inventory} onInventoryUpdated={fetchInventory} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 