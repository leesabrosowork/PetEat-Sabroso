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

interface InventoryItem {
  _id: string
  item: string
  category: string
  stock: number
  minStock: number
  status: string
}

export default function StaffDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [id: string]: string | number }>({})
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventory.length - lowStockItems - outOfStockItems}
              </div>
              <p className="text-xs text-muted-foreground">Well stocked</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>View and manage your inventory items</CardDescription>
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
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventory || []).map(item => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleChangeStock(item._id, -1)}
                            disabled={item.stock <= 0}
                            aria-label="Decrease stock"
                          >
                            −
                          </Button>
                          <span className="w-8 text-center">{item.stock}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleChangeStock(item._id, 1)}
                            aria-label="Increase stock"
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
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
                          {item.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min={1}
                            value={quantities[item._id] || ""}
                            onChange={e => setQuantities(prev => ({ ...prev, [item._id]: parseInt(e.target.value) }))}
                            placeholder="Qty to subtract"
                            className="w-32"
                          />
                          <Button onClick={() => handleSubtract(item._id)} variant="secondary">
                            Subtract
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 