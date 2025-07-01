"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Heart, ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

interface PetFormData {
  name: string;
  category: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  color: string;
  gender: string;
  medicalHistory: string;
  allergies: string;
  vaccinations: string;
  healthStatus: string;
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

export default function AddPet() {
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    category: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    color: "",
    gender: "male",
    medicalHistory: "",
    allergies: "",
    vaccinations: "",
    healthStatus: "stable"
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const categoryOptions = Object.keys(PET_CATEGORIES);
  const speciesOptions = useMemo(() => formData.category ? Object.keys(PET_CATEGORIES[formData.category as keyof typeof PET_CATEGORIES]) : [], [formData.category]);
  const breedOptions = useMemo(() => (formData.category && formData.species) ? PET_CATEGORIES[formData.category as keyof typeof PET_CATEGORIES][formData.species as keyof (typeof PET_CATEGORIES)[string]] : [], [formData.category, formData.species]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const formDataToSend = new FormData();
      
      // Append form data with proper array handling
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'medicalHistory' || key === 'vaccinations') {
          // Split text areas by newlines and filter out empty lines
          const arrayValue = value.split('\n').filter((line: string) => line.trim() !== '');
          formDataToSend.append(key, JSON.stringify(arrayValue));
        } else {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Append file if selected
      if (selectedFile) {
        formDataToSend.append('profilePicture', selectedFile);
      }

      const response = await fetch('http://localhost:8080/api/pets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard/user")
      } else {
        alert(data.message || 'Failed to register pet')
      }
    } catch (error) {
      console.error('Error registering pet:', error)
      alert('Error registering pet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard/user" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Pet</h1>
          <p className="text-gray-600">Register your pet in our system</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Pet Registration
            </CardTitle>
            <CardDescription>Fill out your pet's information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture</Label>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
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
                    <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <span className="text-sm text-gray-600">Click to upload image</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={val => handleChange('category', val)} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Species</Label>
                  <Select value={formData.species} onValueChange={val => handleChange('species', val)} required disabled={!formData.category}>
                    <SelectTrigger id="species">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {speciesOptions.map(species => (
                        <SelectItem key={species} value={species}>{species}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Select value={formData.breed} onValueChange={val => handleChange('breed', val)} required disabled={!formData.species}>
                    <SelectTrigger id="breed">
                      <SelectValue placeholder="Select breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breedOptions.map((breed: string) => (
                        <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Pet Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Buddy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="e.g., 3"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    placeholder="e.g., 65"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    placeholder="e.g., Golden"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Any previous medical conditions, surgeries, or treatments..."
                  value={formData.medicalHistory}
                  onChange={(e) => handleChange("medicalHistory", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any known allergies or sensitivities..."
                  value={formData.allergies}
                  onChange={(e) => handleChange("allergies", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaccinations">Vaccinations</Label>
                <Textarea
                  id="vaccinations"
                  placeholder="List current vaccinations and dates..."
                  value={formData.vaccinations}
                  onChange={(e) => handleChange("vaccinations", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/user")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Register Pet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
