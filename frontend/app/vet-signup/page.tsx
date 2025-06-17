"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
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

const clinicTypes = [
  "Small Animal Practice",
  "Mixed Practice",
  "Emergency Clinic",
  "Specialty Clinic",
  "Mobile Practice"
]

interface TimeRange {
  isOpen: boolean;
  start: string;
  end: string;
}

interface FormData {
  clinicName: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  location: {
    address: string;
    city: string;
    province: string;
    zipCode: string;
  };
  licenseNumber: string;
  businessPermit: File | null;
  clinicType: string;
  openingHours: {
    monday: TimeRange;
    tuesday: TimeRange;
    wednesday: TimeRange;
    thursday: TimeRange;
    friday: TimeRange;
    saturday: TimeRange;
    sunday: TimeRange;
  };
  servicesOffered: string[];
  animalsCatered: string[];
  agreedToTerms: boolean;
}

export default function VetSignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    clinicName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    location: {
      address: "",
      city: "",
      province: "",
      zipCode: ""
    },
    licenseNumber: "",
    businessPermit: null,
    clinicType: "",
    openingHours: {
      monday: { isOpen: true, start: "08:00", end: "18:00" },
      tuesday: { isOpen: true, start: "08:00", end: "18:00" },
      wednesday: { isOpen: true, start: "08:00", end: "18:00" },
      thursday: { isOpen: true, start: "08:00", end: "18:00" },
      friday: { isOpen: true, start: "08:00", end: "18:00" },
      saturday: { isOpen: true, start: "09:00", end: "15:00" },
      sunday: { isOpen: false, start: "09:00", end: "15:00" }
    },
    servicesOffered: [],
    animalsCatered: [],
    agreedToTerms: false
  })

  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      setIsMapLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (isMapLoaded && mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
      });

      const newMarker = new google.maps.Marker({
        position: defaultCenter,
        map: newMap,
        draggable: true,
      });

      setMap(newMap);
      setMarker(newMarker);

      // Add click listener to map
      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleMapClick(e);
        }
      });

      // Add drag end listener to marker
      newMarker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleMapClick(e);
        }
      });
    }
  }, [isMapLoaded, map]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && marker) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Update marker position
      marker.setPosition(e.latLng);
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components;
          let city = '';
          let province = '';
          let zipCode = '';

          addressComponents.forEach((component: google.maps.GeocoderAddressComponent) => {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              province = component.long_name;
            } else if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          });

          setFormData(prev => ({
            ...prev,
            location: {
              address: results[0].formatted_address,
              city,
              province,
              zipCode
            }
          }));
        }
      });
    }
  }, [marker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
      
      // Handle nested objects and arrays
      const formDataObj: Record<string, string | File> = {
        clinicName: formData.clinicName,
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        clinicType: formData.clinicType,
        address: JSON.stringify({
          address: formData.location.address,
          city: formData.location.city,
          province: formData.location.province,
          zipCode: formData.location.zipCode
        }),
        openingHours: JSON.stringify(formData.openingHours),
        servicesOffered: JSON.stringify(formData.servicesOffered || []),
        animalsCatered: JSON.stringify(formData.animalsCatered || [])
      }

      // Append each field to FormData
      Object.entries(formDataObj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value)
        }
      })

      // Handle file upload separately
      if (formData.businessPermit) {
        formDataToSend.append('businessPermit', formData.businessPermit)
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
        setError(data.message || "Signup failed. Please try again.")
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError("An error occurred. Please try again.")
    }

    setLoading(false)
  }

  const handleChange = (field: string, value: string | string[] | boolean | File | TimeRange) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => {
        const newData = { ...prev }
        if (parent === 'location') {
          newData.location = { ...prev.location, [child]: value as string }
        } else if (parent === 'openingHours') {
          newData.openingHours = { ...prev.openingHours, [child]: value as TimeRange }
        }
        return newData
      })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, businessPermit: e.target.files![0] }))
    }
  }

  const formatTimeRange = (range: TimeRange): string => {
    if (!range.start || !range.end) return "Closed";
    return `${range.start} - ${range.end}`;
  }

  // Custom MultiSelect component implementation
  const MultiSelect = ({ options, value, onChange, placeholder }: {
    options: string[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
  }) => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string[]>(value)

    const handleSelect = (option: string) => {
      const newSelected = [...selected, option]
      setSelected(newSelected)
      onChange(newSelected)
      setOpen(false)
    }

    const handleUnselect = (option: string) => {
      const newSelected = selected.filter(item => item !== option)
      setSelected(newSelected)
      onChange(newSelected)
    }

    return (
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
          {selected.map((option) => (
            <Badge key={option} variant="secondary">
              {option}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleUnselect(option)}
              >
                <span className="sr-only">Remove {option}</span>
                <span aria-hidden="true">×</span>
              </button>
            </Badge>
          ))}
          <button
            type="button"
            className="text-sm text-gray-500"
            onClick={() => setOpen(!open)}
          >
            {selected.length === 0 ? placeholder : "+ Add more"}
          </button>
        </div>
        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <Command>
              <CommandGroup>
                {options
                  .filter(option => !selected.includes(option))
                  .map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => handleSelect(option)}
                    >
                      {option}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </div>
        )}
      </div>
    )
  }

  const handleDayToggle = (day: keyof FormData['openingHours']) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          isOpen: !prev.openingHours[day].isOpen
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      {showOtp && registeredEmail ? (
        <OtpVerification email={registeredEmail} />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
              <span className="text-2xl font-bold">PetEat</span>
            </div>
            {error && (
              <div className="mb-2 text-red-600 text-sm font-medium">{error}</div>
            )}
            <CardTitle>Veterinary Clinic Registration</CardTitle>
            <CardDescription>Join our network of trusted veterinary clinics</CardDescription>
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
                  <Label htmlFor="ownerName">Owner/Manager Name</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                    required
                    placeholder="Enter owner/manager name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    required
                    placeholder="Enter contact number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clinic Location</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter street address"
                      value={formData.location.address}
                      onChange={(e) => handleChange("location.address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      value={formData.location.city}
                      onChange={(e) => handleChange("location.city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      placeholder="Enter province"
                      value={formData.location.province}
                      onChange={(e) => handleChange("location.province", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="Enter ZIP code"
                      value={formData.location.zipCode}
                      onChange={(e) => handleChange("location.zipCode", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Veterinary License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                    required
                    placeholder="Enter license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicType">Clinic Type</Label>
                  <Select
                    value={formData.clinicType}
                    onValueChange={(value) => handleChange("clinicType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Animals Catered</Label>
                <MultiSelect
                  options={animalTypes}
                  value={formData.animalsCatered}
                  onChange={(value) => handleChange("animalsCatered", value)}
                  placeholder="Select animals you cater to"
                />
              </div>

              <div className="space-y-4">
                <Label>Business Hours</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weekdays */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Weekdays</h3>
                    <div className="space-y-4">
                      {[
                        { id: 'monday', label: 'Monday' },
                        { id: 'tuesday', label: 'Tuesday' },
                        { id: 'wednesday', label: 'Wednesday' },
                        { id: 'thursday', label: 'Thursday' },
                        { id: 'friday', label: 'Friday' }
                      ].map(({ id, label }) => (
                        <div key={id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={id}
                              checked={formData.openingHours[id as keyof FormData['openingHours']].isOpen}
                              onCheckedChange={() => handleDayToggle(id as keyof FormData['openingHours'])}
                            />
                            <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                          </div>
                          {formData.openingHours[id as keyof FormData['openingHours']].isOpen && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <TimePicker
                                value={formData.openingHours[id as keyof FormData['openingHours']].start}
                                onChange={(time: string) => handleChange(`openingHours.${id}`, { 
                                  ...formData.openingHours[id as keyof FormData['openingHours']], 
                                  start: time 
                                })}
                              />
                              <TimePicker
                                value={formData.openingHours[id as keyof FormData['openingHours']].end}
                                onChange={(time: string) => handleChange(`openingHours.${id}`, { 
                                  ...formData.openingHours[id as keyof FormData['openingHours']], 
                                  end: time 
                                })}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekends */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Weekends</h3>
                    <div className="space-y-4">
                      {[
                        { id: 'saturday', label: 'Saturday' },
                        { id: 'sunday', label: 'Sunday' }
                      ].map(({ id, label }) => (
                        <div key={id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={id}
                              checked={formData.openingHours[id as keyof FormData['openingHours']].isOpen}
                              onCheckedChange={() => handleDayToggle(id as keyof FormData['openingHours'])}
                            />
                            <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                          </div>
                          {formData.openingHours[id as keyof FormData['openingHours']].isOpen && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <TimePicker
                                value={formData.openingHours[id as keyof FormData['openingHours']].start}
                                onChange={(time: string) => handleChange(`openingHours.${id}`, { 
                                  ...formData.openingHours[id as keyof FormData['openingHours']], 
                                  start: time 
                                })}
                              />
                              <TimePicker
                                value={formData.openingHours[id as keyof FormData['openingHours']].end}
                                onChange={(time: string) => handleChange(`openingHours.${id}`, { 
                                  ...formData.openingHours[id as keyof FormData['openingHours']], 
                                  end: time 
                                })}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Permit</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => handleChange("agreedToTerms", checked)}
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
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