"use client"

import { useState } from "react"
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

interface AddItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: any) => void
}

export function AddItemDialog({ isOpen, onClose, onAddItem }: AddItemDialogProps) {
  const [item, setItem] = useState("")
  const [category, setCategory] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("")

  const handleSubmit = () => {
    onAddItem({
      item,
      category,
      stock: parseInt(stock),
      minStock: parseInt(minStock),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Fill in the details of the new item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item" className="text-right">
              Item
            </Label>
            <Input id="item" value={item} onChange={(e) => setItem(e.target.value)} className="col-span-3" />
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}