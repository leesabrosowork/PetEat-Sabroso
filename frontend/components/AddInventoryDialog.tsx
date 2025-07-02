"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddInventoryDialog({ open, onOpenChange, onAdded }: AddInventoryDialogProps) {
  const [formData, setFormData] = useState({
    item: '',
    stock: 1,
    minStock: 5,
    category: '',
    status: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock',
    expirationDate: '',
    manufacturingDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const categories = [
    'Medication',
    'Supplies', 
    'Equipment',
    'Food',
    'Vaccine',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!formData.category) {
      toast({ 
        title: "Error", 
        description: "Please select a category", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!formData.item.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter an item name", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/vet-clinic/inventory", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          // Ensure category is properly set
          category: formData.category === 'Other' ? customCategory : formData.category,
        }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Inventory item added successfully" });
        onAdded();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add inventory item');
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to add inventory item", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="item">Item Name *</Label>
            <Input 
              id="item" 
              value={formData.item} 
              onChange={e => setFormData({ ...formData, item: e.target.value })} 
              placeholder="Enter item name"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={value => {
                if (value === 'Other') {
                  setFormData(prev => ({ ...prev, category: customCategory }));
                } else {
                  setFormData(prev => ({ ...prev, category: value }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
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
              <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input id="minStock" type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'in-stock' | 'low-stock' | 'out-of-stock') => setFormData({ ...formData, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate || ''}
              onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
            <Input
              id="manufacturingDate"
              type="date"
              value={formData.manufacturingDate || ''}
              onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 