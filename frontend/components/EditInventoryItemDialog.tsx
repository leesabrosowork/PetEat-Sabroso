"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditInventoryItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateInventoryItem: (item: any) => void
  item: any
}

export function EditInventoryItemDialog({ isOpen, onClose, onUpdateInventoryItem, item }: EditInventoryItemDialogProps) {
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [manufacturingDate, setManufacturingDate] = useState("")

  useEffect(() => {
    if (item) {
      setItemName(item.item)
      setCategory(item.category)
      setStock(item.stock)
      setMinStock(item.minStock)
      setExpirationDate(item.expirationDate ? item.expirationDate.split('T')[0] : '')
      setManufacturingDate(item.manufacturingDate ? item.manufacturingDate.split('T')[0] : '')
    }
  }, [item])

  const handleSubmit = () => {
    if (!item?._id) {
      console.error('Cannot update item: Missing _id', item);
      return;
    }
    
    onUpdateInventoryItem({
      _id: item._id, // Ensure _id is preserved
      item: itemName,
      category,
      stock: parseInt(stock, 10) || 0,
      minStock: parseInt(minStock, 10) || 0,
      expirationDate,
      manufacturingDate,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the item's details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item" className="text-right">
              Item
            </Label>
            <Input id="item" value={itemName} onChange={(e) => setItemName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select onValueChange={setCategory} defaultValue={category}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medication">Medication</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Stock
            </Label>
            <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right">
              Min. Stock
            </Label>
            <Input id="minStock" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="col-span-3" />
          </div>
          <div>
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
            <Input
              id="manufacturingDate"
              type="date"
              value={manufacturingDate}
              onChange={e => setManufacturingDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}