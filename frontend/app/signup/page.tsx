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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import OtpVerification from "./OtpVerification"
import PublicLayout from '../public-layout'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    address: ""
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

    try {
      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          contactNumber: formData.contactNumber,
          address: formData.address,
          role: "pet owner",
          needsOnboarding: true
        }),
      })

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

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        {showOtp && registeredEmail ? (
          <OtpVerification email={registeredEmail} isVetClinic={false} />
        ) : (
          <Card className="w-full max-w-md">
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
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
              </form>
              <div className="flex justify-between mt-4">
                <Link href="/login" className="text-blue-600 hover:underline text-sm">Already have an account?</Link>
                <Link href="/vet-signup" className="text-blue-600 hover:underline text-sm">Sign up as a vet clinic</Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  )
}
