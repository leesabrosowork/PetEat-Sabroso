"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import PublicLayout from '../public-layout'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<0 | 1>(0)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Step 0: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("http://localhost:8080/api/otp/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (response.ok) {
        setStep(1)
        setSuccess("OTP sent to your email.")
      } else {
        setError(data.message || "Could not send OTP.")
      }
    } catch {
      setError("An error occurred. Try again later.")
    }
    setLoading(false)
  }

  // Reset to step 0 for new OTP
  const handleRequestNewOtp = () => {
    setStep(0)
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccess("")
  }

  // Step 1: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }
    try {
      const response = await fetch("http://localhost:8080/api/otp/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess("Password reset successful! Redirecting to login...")
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setError(data.message || "Password reset failed.")
      }
    } catch {
      setError("An error occurred. Try again later.")
    }
    setLoading(false)
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Reset your password using OTP verification</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</Button>
                {error && <div className="text-red-500 text-xs">{error}</div>}
                {success && <div className="text-green-600 text-xs">{success}</div>}
              </form>
            )}
            {step === 1 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  minLength={6}
                  required
                  placeholder="Enter OTP"
                  className="tracking-widest text-center font-mono text-lg"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="New password"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
                {error && (
                  <div className="text-red-500 text-xs mt-2 flex flex-col items-center">
                    {error}
                    {(error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid") || error.toLowerCase().includes("no otp")) && (
                      <Button variant="link" className="p-0 h-auto text-xs text-blue-600 underline mt-1" onClick={handleRequestNewOtp} type="button">
                        Request new OTP
                      </Button>
                    )}
                  </div>
                )}
                {success && <div className="text-green-600 text-xs">{success}</div>}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
