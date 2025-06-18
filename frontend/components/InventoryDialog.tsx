"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface InventoryItem {
  _id: string;
  item: string;
  stock: number;
  minStock: number;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

interface InventoryDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function InventoryDialog({ item, open, onOpenChange, onUpdate }: InventoryDialogProps) {
  const [formData, setFormData] = useState({
    item: '',
    stock: 0,
    minStock: 0,
    category: '',
    status: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock',
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [customCategory, setCustomCategory] = useState('');

  const categories = [
    'Medication',
    'Supplies',
    'Equipment',
    'Food'
  ];

  useEffect(() => {
    if (item) {
      setFormData({
        item: item.item,
        stock: item.stock,
        minStock: item.minStock,
        category: item.category,
        status: item.status,
      })
    }
  }, [item])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async () => {
    if (!item) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/vet-clinic/inventory/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        });
        onUpdate();
        onOpenChange(false);
      } else {
        throw new Error('Failed to update inventory item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Inventory - {item.item}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="item">Item Name</Label>
            <Input
              id="item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={value => {
              setFormData({ ...formData, category: value === 'Other' ? customCategory : value });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.category === 'Other' && (
              <Input
                className="mt-2"
                placeholder="Enter custom category"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                onBlur={() => setFormData({ ...formData, category: customCategory })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'in-stock' | 'low-stock' | 'out-of-stock') => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <Badge className={getStatusColor(formData.status)}>
                {formData.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 