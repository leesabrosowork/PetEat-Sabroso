import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Trash2, Minus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format, differenceInDays } from 'date-fns';

interface InventoryItem {
  _id: string
  item: string
  stock: number
  minStock: number
  category: string
  status: string
  lastUpdated: string
  createdAt: string
  expirationDate?: string
}

interface InventoryManagementProps {
  inventory: InventoryItem[]
  onInventoryUpdated: () => void
}

export default function InventoryManagement({ inventory, onInventoryUpdated }: InventoryManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isUpdatingStock, setIsUpdatingStock] = useState<Record<string, boolean>>({})
  const [newItem, setNewItem] = useState({
    item: "",
    stock: 0,
    minStock: 5,
    category: "Supplies",
    status: "in-stock",
    expirationDate: ""
  })
  const { toast } = useToast()
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [inventoryExpiration, setInventoryExpiration] = useState('all');

  const handleCreateItem = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/super-admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory item created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewItem({
          item: "",
          stock: 0,
          minStock: 5,
          category: "Supplies",
          status: "in-stock",
          expirationDate: ""
        })
        onInventoryUpdated()
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
        description: "Failed to create inventory item",
        variant: "destructive",
      })
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/inventory/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item: selectedItem.item,
          stock: selectedItem.stock,
          minStock: selectedItem.minStock,
          category: selectedItem.category,
          status: selectedItem.status,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedItem(null)
        onInventoryUpdated()
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
        description: "Failed to update inventory item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/inventory/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory item deleted successfully",
        })
        onInventoryUpdated()
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
        description: "Failed to delete inventory item",
        variant: "destructive",
      })
    }
  }

  // Add or subtract stock
  const handleChangeStock = async (id: string, change: number) => {
    try {
      setIsUpdatingStock(prev => ({ ...prev, [id]: true }))
      const token = localStorage.getItem("token")
      
      const payload = { 
        amount: Number(change) // Server expects 'amount' field
      }
      
      console.log('Sending stock update:', { id, payload })
      
      console.log('Sending request to:', `http://localhost:8080/api/super-admin/inventory/${id}/stock`)
      console.log('Request payload:', payload)
      
      const response = await fetch(`http://localhost:8080/api/super-admin/inventory/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      let responseData
      try {
        // First try to parse as JSON
        responseData = await response.json()
      } catch (e) {
        // If not JSON, get the response as text
        const text = await response.text()
        throw new Error(`Invalid JSON response: ${text}`)
      }
      
      console.log('Raw server response:', responseData)
      
      if (!response.ok) {
        console.error('Stock update failed:', { 
          status: response.status, 
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          response: responseData 
        })
        
        // Handle different error response formats
        const errorMessage = responseData?.message || 
                            responseData?.error || 
                            responseData?.statusText || 
                            `Server responded with ${response.status}: ${response.statusText}`
                            
        throw new Error(errorMessage)
      }

      console.log('Stock update successful:', responseData)
      onInventoryUpdated()
    } catch (error: any) {
      console.error('Error updating stock:', error)
      const errorMessage = error.message || 'Failed to update stock'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStock(prev => ({
        ...prev,
        [id]: false,
      }))
    }
  }

  // Filtering logic
  const filteredInventory = inventory.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesSearch = !search || item.item.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const filteredExpirationInventory = filteredInventory.filter(item => {
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
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your clinic's inventory items and stock levels</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <Label>Category</Label>
            <select className="border rounded px-2 py-1" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All</option>
              <option value="Medication">Medication</option>
              <option value="Supplies">Supplies</option>
              <option value="Equipment">Equipment</option>
              <option value="Food">Food</option>
              <option value="Vaccine">Vaccine</option>
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select className="border rounded px-2 py-1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          <div>
            <Label>Expiration</Label>
            <select className="border rounded px-2 py-1" value={inventoryExpiration} onChange={e => setInventoryExpiration(e.target.value)}>
              <option value="all">All</option>
              <option value="soon">Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <Label>Search</Label>
            <Input placeholder="Search item..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      <Table className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <TableHeader className="bg-gray-50 dark:bg-gray-700">
          <TableRow>
            <TableHead className="text-gray-900 dark:text-white">Item Name</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Stock Level</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Min Stock</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Category</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Expiration Date</TableHead>
            <TableHead className="text-gray-900 dark:text-white">Last Updated</TableHead>
            <TableHead className="text-right text-gray-900 dark:text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpirationInventory.map((item) => {
            let expDate = item.expirationDate ? new Date(item.expirationDate) : null;
            let expSoon = expDate && differenceInDays(expDate, new Date()) <= 7 && differenceInDays(expDate, new Date()) >= 0;
            let expClass = '';
            if (expSoon) expClass = 'bg-red-50 dark:bg-red-900';
            if (expDate && expDate < new Date()) expClass = 'bg-red-100 text-red-800';
            return (
              <TableRow key={item._id} className={expClass}>
                <TableCell className="font-medium text-gray-900 dark:text-white">{item.item}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStock(item._id, -1)}
                      disabled={isUpdatingStock[item._id] || item.stock <= 0}
                      className="h-8 w-8 p-0"
                      aria-label="Decrease stock"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className={`w-8 text-center font-medium ${
                      item.stock < item.minStock
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.stock}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStock(item._id, 1)}
                      disabled={isUpdatingStock[item._id]}
                      className="h-8 w-8 p-0"
                      aria-label="Increase stock"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    {isUpdatingStock[item._id] && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.minStock}</TableCell>
                <TableCell>{item.category}</TableCell>
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
                  {expDate ? (
                    <span className={expSoon ? 'text-red-600 font-bold' : ''}>
                      {format(expDate, 'yyyy-MM-dd')}
                      {expSoon && <span className="ml-2 text-xs">(Expiring soon)</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedItem(item)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteItem(item._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Inventory Item</DialogTitle>
            <DialogDescription>
              Add a new item to the inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item">Item Name</Label>
              <Input
                id="item"
                value={newItem.item}
                onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={newItem.stock}
                onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={newItem.minStock}
                onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full px-3 py-2 border rounded-md"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Medication">Medication</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Food">Food</option>
                <option value="Vaccine">Vaccine</option>
              </select>
            </div>
            <div>
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={newItem.expirationDate}
                onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Create Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the inventory item's information.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-item">Item Name</Label>
                <Input
                  id="edit-item"
                  value={selectedItem.item}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, item: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={selectedItem.stock}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, stock: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-minStock">Minimum Stock</Label>
                <Input
                  id="edit-minStock"
                  type="number"
                  value={selectedItem.minStock}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, minStock: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedItem.category}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, category: e.target.value })
                  }
                >
                  <option value="Medication">Medication</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Food">Food</option>
                  <option value="Vaccine">Vaccine</option>
                </select>
              </div>
              <div>
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={selectedItem.expirationDate}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, expirationDate: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 