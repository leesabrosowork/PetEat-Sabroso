"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"
import { useSocket } from "../context/SocketContext"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const router = useRouter()
  const { joinRoom } = useSocket()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/settings')
        const data = await response.json()
        if (data.success && data.data) {
          setMaintenanceMode(data.data.maintenanceMode)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])
 
   const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data and token in localStorage
        localStorage.setItem("user", JSON.stringify(data.data.user))
        localStorage.setItem("role", data.data.role)
        localStorage.setItem("token", data.data.token)

        // Join the room based on user role
        const roomId = `${data.data.role}_${data.data.user._id}`
        const userInfo = {
          email: data.data.user.email,
          role: data.data.role,
          id: data.data.user._id
        }
        joinRoom(roomId, userInfo)

        // Show welcome toast
        toast({
          title: "Connected to real-time features!",
          description: "You'll receive notifications in real-time.",
        })

        // Redirect based on role
        switch (data.data.role) {
          case "user":
          case "pet owner":
            router.push("/dashboard/user")
            break
          case "admin":
            router.push("/dashboard/admin")
            break
          case "doctor":
            router.push("/dashboard/doctor")
            break
          case "staff":
            router.push("/dashboard/staff")
            break
          case "super admin":
            router.push("/dashboard/super-admin")
            break
          default:
            router.push("/")
        }
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Please check your credentials and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
              <span className="text-2xl font-bold">PetEat</span>
            </div>
            <CardTitle>Under Maintenance</CardTitle>
            <CardDescription>
              We are currently performing maintenance. Please check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
 
   return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/peteat-logo.png" alt="PetEat Logo" width={32} height={32} />
            <span className="text-2xl font-bold">PetEat</span>
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 mb-4">Demo Accounts:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Super Admin:</strong> superadmin@peteat.com / superadmin123
              </p>
              <p>
                <strong>Admin:</strong> admin@peteat.com / admin123
              </p>
              <p>
                <strong>Doctor:</strong> doctor@peteat.com / doctor123
              </p>
              <p>
                <strong>User:</strong> user@peteat.com / user123
              </p>
              <p>
                <strong>Staff:</strong> staff@peteat.com / staff123
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
