"use client"

import { useState, useEffect, useMemo } from "react"
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

// Static mapping for categories, types, and breeds
const PET_CATEGORIES: Record<string, Record<string, string[]>> = {
  Mammals: {
    Dog: ["Aspin", "Shih Tzu", "Chihuahua", "Pomeranian", "Labrador Retriever", "Poodle (Toy/Mini)", "Siberian Husky", "German Shepherd", "Beagle", "Dachshund"],
    Cat: ["Puspin (Pusang Pinoy)", "Persian", "Siamese", "British Shorthair", "Scottish Fold", "American Shorthair", "Maine Coon", "Ragdoll", "Exotic Shorthair", "Bengal"],
    Rabbit: ["New Zealand White", "Holland Lop", "Lionhead", "Rex", "Mini Rex", "Flemish Giant", "Netherland Dwarf", "American Fuzzy Lop", "Angora", "Californian"],
    "Guinea Pig": ["American", "Abyssinian", "Peruvian", "Teddy", "Silkie (Sheltie)", "Texel", "White Crested", "Coronet", "Skinny Pig (hairless)", "Baldwin"],
    Hamster: ["Syrian", "Roborovski", "Campbell's Dwarf", "Winter White Dwarf", "Chinese", "Hybrid Dwarf", "Long-haired Syrian (Teddy Bear)", "Albino Dwarf", "Black Syrian", "Russian Dwarf"],
    Mouse: ["Fancy Mouse", "Feeder Mouse", "Hairless Mouse", "Satin Mouse", "Show Mouse", "Brindle Mouse", "Albino Mouse", "Long-haired Mouse", "Frizzy (Rex) Mouse", "Spiny Mouse"],
    Rat: ["Fancy Rat", "Dumbo Rat", "Hairless Rat", "Rex Rat", "Albino Rat", "Siamese Rat", "Hooded Rat", "Manx Rat (tailless)", "Bristle Coat Rat", "Burmese Rat"],
    Pig: ["Native Pig (Philippine Native)", "Large White", "Landrace", "Duroc", "Pietrain", "Berkshire", "Hampshire", "Chester White", "Tamworth", "Pot-bellied Pig"]
  },
  Birds: {
    Lovebird: ["Fischer's Lovebird", "Peach-faced Lovebird", "Masked Lovebird", "Lutino Lovebird", "Albino Lovebird", "Blue Peach-faced Lovebird", "Yellow-collared Lovebird", "Black-cheeked Lovebird", "Nyasa Lovebird", "Madagascar Lovebird"],
    Parakeet: ["Budgerigar (Budgie)", "Indian Ringneck", "Alexandrine Parakeet", "Monk Parakeet (Quaker)", "Plum-headed Parakeet", "Moustached Parakeet", "Bourke's Parakeet", "Lineolated Parakeet", "Psittacula Parakeet", "Grass Parakeet"],
    Maya: ["Chestnut Munia (Philippine Maya)", "Eurasian Tree Sparrow", "Black-headed Munia", "Scaly-breasted Munia", "White-bellied Munia", "Java Sparrow", "Red Avadavat", "Yellow-breasted Munia", "Plain Munia", "Bronze Mannikin"],
    Cockatiel: ["Normal Grey Cockatiel", "Lutino Cockatiel", "Pearl Cockatiel", "Pied Cockatiel", "White-faced Cockatiel", "Cinnamon Cockatiel", "Albino Cockatiel", "Fallow Cockatiel", "Silver Cockatiel", "Yellow-cheeked Cockatiel"],
    Dove: ["Philippine Collared Dove", "Zebra Dove", "Red Turtle Dove", "Spotted Dove", "White-winged Dove", "Rock Dove (Pigeon)", "Diamond Dove", "Laughing Dove", "Emerald Dove", "Pied Imperial Pigeon"],
    Peogeon: ["Rock Pigeon", "Racing Homer", "King Pigeon", "Philippine Green Pigeon", "Jacobin Pigeon", "Fantail Pigeon", "Lahore Pigeon", "Modena Pigeon", "Chinese Owl Pigeon", "English Carrier"]
  },
  Fish: {
    "Gold Fish": ["Common Goldfish", "Comet Goldfish", "Fantail Goldfish", "Ryukin Goldfish", "Oranda Goldfish", "Black Moor Goldfish", "Ranchu Goldfish", "Bubble Eye Goldfish", "Celestial Eye Goldfish", "Pearlscale Goldfish"],
    Koi: ["Kohaku", "Taisho Sanke (Sanke)", "Showa Sanshoku (Showa)", "Shusui", "Asagi", "Utsurimono", "Bekko", "Ogon", "Goshiki", "Doitsu"],
    "Beta Fish": ["Veiltail Betta", "Crowntail Betta", "Halfmoon Betta", "Double Tail Betta", "Plakat Betta", "Delta Tail Betta", "Super Delta Betta", "Rosetail Betta", "Halfmoon Plakat", "Dumbo (Elephant Ear) Betta"],
    Tilapia: ["Nile Tilapia", "Mozambique Tilapia", "Red Tilapia", "Blue Tilapia", "Wami Tilapia", "Zanzibar Tilapia", "Aureus Tilapia", "Hornorum Tilapia", "Galilaea Tilapia", "Rendalli Tilapia"],
    Tetra: ["Neon Tetra", "Cardinal Tetra", "Black Skirt Tetra", "Glowlight Tetra", "Ember Tetra", "Rummy Nose Tetra", "Lemon Tetra", "Serpae Tetra", "Diamond Tetra", "Congo Tetra"],
    Guppy: ["Fancy Guppy", "Endler Guppy", "Cobra Guppy", "Tuxedo Guppy", "Moscow Guppy", "Delta Tail Guppy", "Half Black Guppy", "Albino Guppy", "Grass Tail Guppy", "Snakeskin Guppy"],
    Molly: ["Black Molly", "Sailfin Molly", "Balloon Molly", "Lyretail Molly", "Dalmatian Molly", "Gold Dust Molly", "Marble Molly", "Silver Molly", "Shortfin Molly", "Creamsicle Molly"]
  },
  Reptiles: {
    Turtle: ["Red-eared Slider", "Philippine Pond Turtle", "Softshell Turtle", "Yellow-bellied Slider", "River Cooter", "Painted Turtle", "Snapping Turtle", "Common Musk Turtle", "African Sideneck Turtle", "Map Turtle"],
    Gekko: ["Tokay Gecko", "Common House Gecko", "Leopard Gecko", "Crested Gecko", "Gargoyle Gecko", "Golden Gecko", "Flying Gecko", "Day Gecko", "Moorish Gecko", "Chinese Cave Gecko"],
    Snake: ["Philippine Cobra", "Reticulated Python", "Ball Python", "Burmese Python", "Green Tree Python", "Corn Snake", "King Snake", "Rat Snake", "Garter Snake", "Milk Snake"],
    Lizard: ["Common House Lizard (Butiki)", "Philippine Sailfin Lizard", "Monitor Lizard (Bayawak)", "Flying Dragon (Draco Lizard)", "Green Iguana", "Brown Anole", "Tokay Gecko", "Long-tailed Grass Lizard", "Frilled Lizard", "Bearded Dragon"]
  },
  Amphibians: {
    Frog: ["Philippine Horned Frog", "Common Tree Frog", "Cane Toad", "Asian Grass Frog", "Bullfrog", "Leopard Frog", "Green Paddy Frog", "Pond Frog", "Tomato Frog", "Poison Dart Frog"],
    Toad: ["Cane Toad", "Asian Common Toad", "Philippine Flat-headed Toad", "Luzon Forest Toad", "Mindanao Horned Toad", "Asian Giant Toad", "Rice Field Toad", "Marsh Toad", "Luzon Narrow-mouthed Toad", "Dwarf Toad"],
    Newt: ["Japanese Fire-Bellied Newt", "Chinese Fire-Bellied Newt", "Eastern Newt", "Iberian Ribbed Newt", "Alpine Newt", "Smooth Newt", "California Newt", "Tylototriton Newt", "Cynops Orientalis", "Vietnamese Warty Newt"],
    Salamander: ["Chinese Giant Salamander", "Japanese Giant Salamander", "Tiger Salamander", "Axolotl", "Spotted Salamander", "Fire Salamander", "Slimy Salamander", "Marbled Salamander", "Eastern Red-backed Salamander", "Blue-spotted Salamander"]
  }
};

export function EditPetDialog({ isOpen, onClose, onUpdatePet, pet }: EditPetDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    breed: "",
    age: "",
    color: "",
    gender: "male",
    healthStatus: "stable"
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const breedOptions = useMemo(() => (formData.category)
    ? Object.values(PET_CATEGORIES[formData.category as keyof typeof PET_CATEGORIES] as Record<string, string[]>).flat()
    : [], [formData.category]);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        category: pet.category || "",
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
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select value={formData.category} onValueChange={value => setFormData({...formData, category: value, breed: ""})}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {Object.keys(PET_CATEGORIES).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="breed" className="text-right">Breed</Label>
            <Select value={formData.breed} onValueChange={value => setFormData({...formData, breed: value})} disabled={!formData.category}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select breed" /></SelectTrigger>
              <SelectContent>
                {breedOptions.map((breed: string) => (
                  <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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