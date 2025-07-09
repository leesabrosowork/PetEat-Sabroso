"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import OtpVerification from "./OtpVerification"
import PublicLayout from '../public-layout'

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

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    address: "",
    category: "",
    species: "",
    breed: ""
  })
  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const [petData, setPetData] = useState({
    name: '',
    category: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    color: '',
    profilePicture: null as File | null,
    previewUrl: ''
  });

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
    return regex.test(password)
  }

  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Validate username
    if (!formData.username || formData.username.trim() === "") {
      setError("Please enter a username")
      setLoading(false)
      return
    }

    // Validate password
    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters long and contain at least one number and one special character")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    // Validate pet fields
    if (!petData.name || !petData.category || !petData.species || !petData.breed || !petData.age || !petData.gender || !petData.color) {
      setError("Please fill out all pet fields.");
      setLoading(false);
      return;
    }

    if (!petData.profilePicture) {
      setError("Please upload a profile picture for your pet.");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('contactNumber', formData.contactNumber);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('role', 'pet owner');
      formDataToSend.append('needsOnboarding', 'true');
      // Add pet fields
      Object.entries(petData).forEach(([key, value]) => {
        if (key === 'profilePicture' && value) {
          formDataToSend.append('firstPetProfilePicture', value as File);
        } else if (key !== 'previewUrl') {
          formDataToSend.append(`firstPet[${key}]`, value as string);
        }
      });

      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        body: formDataToSend
      });

      const data = await response.json()
      console.log("Signup response:", data)

      if (response.ok) {
        setShowOtp(true)
        setRegisteredEmail(formData.email)
        setError("")
      } else {
        setError(data.message || "Signup failed. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    }

    setLoading(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePetChange = (field: string, value: string) => {
    setPetData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPetData(prev => ({
        ...prev,
        profilePicture: file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  };

  const categoryOptions = Object.keys(PET_CATEGORIES);
  const speciesOptions = useMemo(() => formData.category ? Object.keys(PET_CATEGORIES[formData.category as keyof typeof PET_CATEGORIES]) : [], [formData.category]);
  const breedOptions = useMemo(() => (formData.category && formData.species) ? PET_CATEGORIES[formData.category as keyof typeof PET_CATEGORIES][formData.species as keyof (typeof PET_CATEGORIES)[string]] : [], [formData.category, formData.species]);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-center justify-center p-4 transition-opacity duration-300">
        <Card className="w-full max-w-2xl shadow-xl border-0 transition-all duration-300">
          {showOtp && registeredEmail ? (
            <OtpVerification email={registeredEmail} isVetClinic={false} />
          ) : (
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
                <span className="text-2xl font-bold">PetEat</span>
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Join our pet care community as a pet owner</CardDescription>
            </CardHeader>
          )}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={formData.username} 
                  onChange={(e) => handleChange("username", e.target.value)} 
                  required 
                  placeholder="Choose a username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName} 
                  onChange={(e) => handleChange("fullName", e.target.value)} 
                  required 
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", e.target.value)}
                  placeholder="Enter your contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter your address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  placeholder="Create a password"
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long and contain at least one number and one special character
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Add Your First Pet</h3>
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet Name</Label>
                  <Input id="petName" value={petData.name} onChange={e => handlePetChange('name', e.target.value)} required placeholder="Enter pet name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petCategory">Pet Category</Label>
                  <select id="petCategory" value={petData.category} onChange={e => handlePetChange('category', e.target.value)} required className="w-full border rounded px-2 py-1">
                    <option value="">Select category</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petSpecies">Species</Label>
                  <select id="petSpecies" value={petData.species} onChange={e => handlePetChange('species', e.target.value)} required className="w-full border rounded px-2 py-1" disabled={!petData.category}>
                    <option value="">Select species</option>
                    {petData.category && Object.keys(PET_CATEGORIES[petData.category as keyof typeof PET_CATEGORIES]).map(species => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petBreed">Pet Breed</Label>
                  <select id="petBreed" value={petData.breed} onChange={e => handlePetChange('breed', e.target.value)} required className="w-full border rounded px-2 py-1" disabled={!petData.species}>
                    <option value="">Select breed</option>
                    {petData.category && petData.species && PET_CATEGORIES[petData.category as keyof typeof PET_CATEGORIES][petData.species as keyof (typeof PET_CATEGORIES)[string]].map((breed: string) => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petAge">Pet Age</Label>
                  <Input id="petAge" type="number" value={petData.age} onChange={e => handlePetChange('age', e.target.value)} required placeholder="Enter pet age" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petGender">Pet Gender</Label>
                  <select id="petGender" value={petData.gender} onChange={e => handlePetChange('gender', e.target.value)} required className="w-full border rounded px-2 py-1">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petColor">Pet Color</Label>
                  <Input id="petColor" value={petData.color} onChange={e => handlePetChange('color', e.target.value)} required placeholder="Enter pet color" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petProfilePicture">Pet Profile Picture</Label>
                  <input
                    id="petProfilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handlePetFileChange}
                    required
                    className="block"
                  />
                  {petData.previewUrl && (
                    <img src={petData.previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded border mt-2" />
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
            </form>
            <div className="flex justify-between mt-4">
              <Link href="/login" className="text-blue-600 hover:underline text-sm">Already have an account?</Link>
              <Link href="/vet-signup" className="text-blue-600 hover:underline text-sm">Sign up as a vet clinic</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
