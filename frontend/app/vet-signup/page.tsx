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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import OtpVerification from "../signup/OtpVerification"
import { TimePicker } from "@/components/ui/time-picker"
import PublicLayout from '../public-layout'

const animalTypes = [
  "Dogs",
  "Cats",
  "Birds",
  "Small Mammals",
  "Reptiles",
  "Fish",
  "Exotic Animals",
  "Farm Animals",
  "Wildlife"
]

interface TimeRange {
  isOpen: boolean;
  start: string;
  end: string;
}

interface FormData {
  clinicName: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  landline: string;
  location: {
    address: string;
    city: string;
    province: string;
    zipCode: string;
    coordinates: [number, number];
  };
  licenseNumber: string;
  description: string;
  website: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  documents: {
    businessPermit: File | null;
    identificationCard: File | null;
  };
  openingHours: {
    monday: TimeRange;
    tuesday: TimeRange;
    wednesday: TimeRange;
    thursday: TimeRange;
    friday: TimeRange;
    saturday: TimeRange;
    sunday: TimeRange;
  };
  petsManaged: string[];
  agreedToTerms: boolean;
}

function formatTimeRangeString(range: TimeRange): string {
  if (!range.isOpen) return 'closed';
  if (!range.start || !range.end) return 'closed';
  return `${range.start}-${range.end}`;
}

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

interface PetManaged {
  category: string;
  species: string;
  breed: string;
}

export default function VetSignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    clinicName: "",
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    landline: "",
    location: {
      address: "",
      city: "",
      province: "",
      zipCode: "",
      coordinates: [0, 0]
    },
    licenseNumber: "",
    description: "",
    website: "",
    socialMedia: {},
    documents: {
      businessPermit: null,
      identificationCard: null
    },
    openingHours: {
      monday: { isOpen: true, start: "08:00", end: "18:00" },
      tuesday: { isOpen: true, start: "08:00", end: "18:00" },
      wednesday: { isOpen: true, start: "08:00", end: "18:00" },
      thursday: { isOpen: true, start: "08:00", end: "18:00" },
      friday: { isOpen: true, start: "08:00", end: "18:00" },
      saturday: { isOpen: true, start: "09:00", end: "15:00" },
      sunday: { isOpen: false, start: "09:00", end: "15:00" }
    },
    petsManaged: [],
    agreedToTerms: false
  })

  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const [petManagedForm, setPetManagedForm] = useState<string>('')
  const [petsManagedDetails, setPetsManagedDetails] = useState<string[]>([])

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
    return regex.test(password)
  }

  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Format website URL
    const formattedWebsite = formatWebsiteUrl(formData.website);
    
    // Validate email format
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address")
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

    if (!formData.agreedToTerms) {
      setError("Please agree to the terms and conditions")
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      
      // Format opening hours
      const weekdayRanges = [
        formData.openingHours.monday,
        formData.openingHours.tuesday,
        formData.openingHours.wednesday,
        formData.openingHours.thursday,
        formData.openingHours.friday,
      ]
      const allWeekdaysSame = weekdayRanges.every(
        (range) =>
          range.isOpen === weekdayRanges[0].isOpen &&
          range.start === weekdayRanges[0].start &&
          range.end === weekdayRanges[0].end
      )
      const mondayToFriday = allWeekdaysSame
        ? formatTimeRangeString(formData.openingHours.monday)
        : ""

      // Handle nested objects and arrays
      const formDataObj: Record<string, any> = {
        clinicName: formData.clinicName,
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        contactNumber: formData.contactNumber,
        landline: formData.landline,
        licenseNumber: formData.licenseNumber,
        description: formData.description,
        website: formattedWebsite,
        socialMedia: JSON.stringify(formData.socialMedia),
        location: JSON.stringify({
          type: 'Point',
          coordinates: formData.location.coordinates,
          address: formData.location.address,
          city: formData.location.city,
          province: formData.location.province,
          zipCode: formData.location.zipCode
        }),
        operatingHours: JSON.stringify({
          mondayToFriday,
          saturday: formatTimeRangeString(formData.openingHours.saturday),
          sunday: formatTimeRangeString(formData.openingHours.sunday),
        }),
        petsManaged: JSON.stringify(petsManagedDetails),
        role: 'clinic',
        needsOnboarding: true
      }

      // Append each field to FormData
      Object.entries(formDataObj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value)
        }
      })

      // Handle file uploads
      if (formData.documents.businessPermit) {
        formDataToSend.append('businessPermit', formData.documents.businessPermit)
      }
      if (formData.documents.identificationCard) {
        formDataToSend.append('identificationCard', formData.documents.identificationCard)
      }

      const response = await fetch('http://localhost:8080/api/auth/vet-signup', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        setShowOtp(true)
        setRegisteredEmail(formData.email)
        setError("")
      } else {
        let errorMsg = "Signup failed. Please try again.";
        if (data.message) {
          errorMsg = typeof data.message === "string"
            ? data.message
            : JSON.stringify(data.message);
        }
        setError(errorMsg);
      }
    } catch (error: any) {
      let errorMsg = "An error occurred. Please try again.";
      if (error && typeof error === "object") {
        if (error.message) errorMsg = error.message;
        else errorMsg = JSON.stringify(error);
      }
      setError(errorMsg);
    }

    setLoading(false)
  }

  const handleChange = (field: string, value: any) => {
    if (field === "website") {
      // Remove any existing http:// or https:// when user is typing
      value = value.replace(/^(https?:\/\/)/, '');
    }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => {
        const newData = { ...prev }
        if (parent === 'location') {
          newData.location = { ...prev.location, [child]: value }
        } else if (parent === 'openingHours') {
          newData.openingHours = { ...prev.openingHours, [child]: value }
        } else if (parent === 'socialMedia') {
          newData.socialMedia = { ...prev.socialMedia, [child]: value }
        } else if (parent === 'documents') {
          newData.documents = { ...prev.documents, [child]: value }
        }
        return newData
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (field: 'businessPermit' | 'identificationCard') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange(`documents.${field}`, e.target.files[0])
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-center justify-center p-4 animate-fade-in-up duration-700">
        <Card className="w-full max-w-3xl shadow-xl border-0 animate-fade-in-down duration-700">
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
            <CardTitle>Vet Clinic Registration</CardTitle>
            <CardDescription>Sign up your clinic to join PetEat</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => handleChange("clinicName", e.target.value)}
                    required
                    placeholder="Enter clinic name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Owner's Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                    placeholder="Enter owner's full name"
                  />
                </div>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    placeholder="Enter clinic email"
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
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Mobile Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleChange("contactNumber", e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landline">Landline</Label>
                  <Input
                    id="landline"
                    type="tel"
                    value={formData.landline}
                    onChange={(e) => handleChange("landline", e.target.value)}
                    placeholder="Enter landline number"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.location.address}
                      onChange={(e) => handleChange("location.address", e.target.value)}
                      required
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.location.city}
                      onChange={(e) => handleChange("location.city", e.target.value)}
                      required
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      value={formData.location.province}
                      onChange={(e) => handleChange("location.province", e.target.value)}
                      required
                      placeholder="Enter province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.location.zipCode}
                      onChange={(e) => handleChange("location.zipCode", e.target.value)}
                      required
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Clinic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                    required
                    placeholder="Enter clinic license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Clinic Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Describe your clinic and services"
                    className="h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="www.example.com"
                  />
                  <p className="text-xs text-gray-500">
                    Enter your website URL without http:// or https:// - it will be added automatically
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.socialMedia.facebook || ""}
                      onChange={(e) => handleChange("socialMedia.facebook", e.target.value)}
                      placeholder="Facebook profile URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.socialMedia.instagram || ""}
                      onChange={(e) => handleChange("socialMedia.instagram", e.target.value)}
                      placeholder="Instagram profile URL"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessPermit">Business Permit</Label>
                    <Input
                      id="businessPermit"
                      type="file"
                      onChange={handleFileChange("businessPermit")}
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="identificationCard">Identification Card</Label>
                    <Input
                      id="identificationCard"
                      type="file"
                      onChange={handleFileChange("identificationCard")}
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.openingHours).map(([day, hours]) => (
                    <div key={day} className="space-y-2">
                      <Label className="capitalize">{day}</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={hours.isOpen}
                          onCheckedChange={(checked) =>
                            handleChange(`openingHours.${day}`, {
                              ...hours,
                              isOpen: checked
                            })
                          }
                        />
                        <span className="text-sm">Open</span>
                        {hours.isOpen && (
                          <div className="flex items-center gap-2">
                            <TimePicker
                              value={hours.start}
                              onChange={(value) =>
                                handleChange(`openingHours.${day}`, {
                                  ...hours,
                                  start: value
                                })
                              }
                            />
                            <span>to</span>
                            <TimePicker
                              value={hours.end}
                              onChange={(value) =>
                                handleChange(`openingHours.${day}`, {
                                  ...hours,
                                  end: value
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Animals Managed</h3>
                  <div className="space-y-2">
                  <Label htmlFor="animalType">Animal Type</Label>
                    <select
                    id="animalType"
                    value={petManagedForm}
                    onChange={e => setPetManagedForm(e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                    <option value="">Select animal type</option>
                    {animalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                </div>
                <Button
                  type="button"
                  className="mt-2"
                  disabled={!petManagedForm}
                  onClick={() => {
                    if (petManagedForm && !petsManagedDetails.includes(petManagedForm)) {
                      setPetsManagedDetails([...petsManagedDetails, petManagedForm]);
                    }
                    setPetManagedForm('');
                  }}
                >
                  Add
                </Button>
                <div className="flex flex-wrap gap-2 mt-2">
                  {petsManagedDetails.map((pet, idx) => (
                    <Badge key={idx} variant="default" className="flex items-center gap-1">
                      {pet}
                      <button type="button" className="ml-1 text-xs" onClick={() => setPetsManagedDetails(petsManagedDetails.filter((_, i) => i !== idx))}>&times;</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) =>
                    handleChange("agreedToTerms", checked)
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Clinic Account"}
              </Button>
            </form>

            <div className="flex justify-between mt-4">
              <Link href="/login" className="text-blue-600 hover:underline text-sm">Already have an account?</Link>
              <Link href="/signup" className="text-blue-600 hover:underline text-sm">Sign up as a pet owner</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
} 