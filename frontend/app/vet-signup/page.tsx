"use client"

import type React from "react"
import { useState } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import OtpVerification from "../signup/OtpVerification"
import { TimePicker } from "@/components/ui/time-picker"

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
        petsManaged: JSON.stringify(formData.petsManaged),
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      {showOtp && registeredEmail ? (
        <OtpVerification email={registeredEmail} isVetClinic={true} />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
              <span className="text-2xl font-bold">PetEat</span>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {typeof error === 'string' ? error : JSON.stringify(error)}
                </AlertDescription>
              </Alert>
            )}
            <CardTitle>Create Veterinary Clinic Account</CardTitle>
            <CardDescription>Join our network of veterinary care providers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex flex-wrap gap-2">
                  {animalTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.petsManaged.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newPetsManaged = formData.petsManaged.includes(type)
                          ? formData.petsManaged.filter((t) => t !== type)
                          : [...formData.petsManaged, type]
                        handleChange("petsManaged", newPetsManaged)
                      }}
                    >
                      {type}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 