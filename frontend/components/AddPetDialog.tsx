"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  users: { _id: string; name: string; }[];
}

export function AddPetDialog({ open, onOpenChange, onAdded, users }: AddPetDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    breed: '',
    age: 1,
    color: '',
    gender: 'male',
    owner: '',
    healthStatus: 'stable',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
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
    setIsSubmitting(true);
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

      const response = await fetch("http://localhost:8080/api/vet-clinic/pets", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Pet added successfully" });
        onAdded();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: '',
          type: 'dog',
          breed: '',
          age: 1,
          color: '',
          gender: 'male',
          owner: '',
          healthStatus: 'stable',
        });
        removeFile();
      } else {
        throw new Error('Failed to add pet');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add pet", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          
          {/* Profile Picture Upload */}
          <div>
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="mt-2">
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

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={value => setFormData({ ...formData, type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <div>
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={value => setFormData({ ...formData, gender: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="owner">Owner</Label>
            <Select value={formData.owner} onValueChange={value => setFormData({ ...formData, owner: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="healthStatus">Health Status</Label>
            <Select value={formData.healthStatus} onValueChange={value => setFormData({ ...formData, healthStatus: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Pet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 