"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Package, LogOut, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"

interface InventoryItem {
  _id: string
  item: string
  category: string
  stock: number
  minStock: number
  status: string
  expirationDate?: string
}

export default function StaffDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [id: string]: string | number }>({})
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryCategory, setInventoryCategory] = useState('')
  const [inventoryStatus, setInventoryStatus] = useState('')
  const [inventoryExpiration, setInventoryExpiration] = useState('all') // 'all', 'soon', 'expired'

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
      return
    }

    fetchInventory()
  }, [router])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8080/api/staff/inventory", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      const data = await response.json()
      if (response.ok) {
        setInventory(data.data)
      } else {
        toast({
          title: "Failed to fetch inventory",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch inventory.",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleSubtract = async (itemId: string) => {
    const quantity = Number(quantities[itemId])
    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity to subtract.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`http://localhost:8080/api/staff/inventory/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ quantity })
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory updated successfully."
        })
        fetchInventory()
        setQuantities({ ...quantities, [itemId]: "" })
      } else {
        toast({
          title: "Failed to update inventory",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update inventory.",
        variant: "destructive"
      })
    }
  }

  const handleChangeStock = async (id: string, amount: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/staff/inventory/${id}/stock`, {
        method: "PATCH",
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

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

  if (!user) return <div>Loading...</div>

  const lowStockItems = inventory.filter(item => item.status === "low-stock").length
  const outOfStockItems = inventory.filter(item => item.status === "out-of-stock").length

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
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">{user.name}</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="text-gray-600">Manage your inventory and stock levels</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <DashboardAnalytics data={{
            inventoryItems: inventory.length,
            lowStockItems: lowStockItems,
          }} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>View and manage your inventory items</CardDescription>
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
            {loading ? (
              <p>Loading inventory...</p>
            ) : (
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
                        const days = (Number(new Date(item.expirationDate)) - Number(new Date())) / (1000*60*60*24);
                        return days >= 0 && days <= 7;
                      }
                      if (inventoryExpiration === 'expired') {
                        if (!item.expirationDate) return false;
                        return Number(new Date(item.expirationDate)) < Number(new Date());
                      }
                      return true;
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
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell>{item.stock}</TableCell>
                          <TableCell>{item.minStock}</TableCell>
                          <TableCell>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleChangeStock(item._id, 1)}>+1</Button>
                            <Button variant="outline" size="sm" onClick={() => handleChangeStock(item._id, -1)} className="ml-2">-1</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 