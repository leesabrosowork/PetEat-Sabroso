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
import { Upload, X } from "lucide-react"

interface EditPetDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdatePet: (pet: any) => void
  pet: any
}

export function EditPetDialog({ isOpen, onClose, onUpdatePet, pet }: EditPetDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    color: "",
    gender: "male",
    healthStatus: "stable"
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        type: pet.type || "",
        breed: pet.breed || "",
        age: pet.age?.toString() || "",
        color: pet.color || "",
        gender: pet.gender || "male",
        healthStatus: pet.healthStatus || "stable"
      })
      setCurrentImageUrl(pet.profilePicture ? `http://localhost:8080/${pet.profilePicture}` : null);
    }
  }, [pet])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      // Append file if selected
      if (selectedFile) {
        formDataToSend.append('profilePicture', selectedFile);
      }

      const response = await fetch(`http://localhost:8080/api/pets/${pet._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const updatedPet = await response.json();
        onUpdatePet(updatedPet.data);
        onClose();
      } else {
        throw new Error('Failed to update pet');
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      alert('Failed to update pet');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
          <DialogDescription>
            Update the pet's details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Profile Picture */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Profile Picture</Label>
            <div className="col-span-3">
              {previewUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={removeFile}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : currentImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={currentImageUrl} 
                    alt="Current" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload image</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="hamster">Hamster</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="breed" className="text-right">Breed</Label>
            <Input 
              id="breed" 
              value={formData.breed} 
              onChange={(e) => setFormData({...formData, breed: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">Age</Label>
            <Input 
              id="age" 
              type="number" 
              value={formData.age} 
              onChange={(e) => setFormData({...formData, age: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <Input 
              id="color" 
              value={formData.color} 
              onChange={(e) => setFormData({...formData, color: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right">Gender</Label>
            <Select value={formData.gender} onValueChange={value => setFormData({...formData, gender: value})}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="healthStatus" className="text-right">Health Status</Label>
            <Select value={formData.healthStatus} onValueChange={value => setFormData({...formData, healthStatus: value})}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}