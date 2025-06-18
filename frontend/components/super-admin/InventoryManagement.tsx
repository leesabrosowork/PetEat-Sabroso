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
import { Edit, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InventoryItem {
  _id: string
  item: string
  stock: number
  minStock: number
  category: string
  status: string
  lastUpdated: string
  createdAt: string
}

interface InventoryManagementProps {
  inventory: InventoryItem[]
  onInventoryUpdated: () => void
}

export default function InventoryManagement({ inventory, onInventoryUpdated }: InventoryManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newItem, setNewItem] = useState({
    item: "",
    stock: 0,
    minStock: 5,
    category: "Supplies",
    status: "in-stock",
  })
  const { toast } = useToast()

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
  const handleChangeStock = async (id: string, amount: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/super-admin/inventory/${id}/stock`, {
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
        description: "Failed to update stock",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Inventory Management</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Min Stock</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow key={item._id}>
              <TableCell>{item.item}</TableCell>
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
          ))}
        </TableBody>
      </Table>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
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
              </select>
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
                </select>
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