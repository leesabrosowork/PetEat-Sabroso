"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Add a new splash component for pet owners
function SuccessSplash() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px]">
      <img src="/peteat-logo.png" alt="PetEat Logo" width={64} height={64} className="mb-4" />
      <div className="text-xl font-semibold mb-2">OTP verified successfully!</div>
      <div className="text-base text-center mb-4">Your account has been created. You can now login to your account.</div>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        onClick={() => router.push("/login")}
      >
        Go to Login
      </button>
    </div>
  );
}

// Add a new splash component for vet clinics
function ApprovalSplash() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px]">
      <img src="/peteat-logo.png" alt="PetEat Logo" width={64} height={64} className="mb-4" />
      <div className="text-xl font-semibold mb-2">OTP successful!</div>
      <div className="text-base text-center mb-4">Please wait for PetEat's approval of your sign up.</div>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        onClick={() => router.push("/")}
      >
        Proceed to homepage
      </button>
    </div>
  );
}

export default function OtpVerification({ email, isVetClinic }: { email: string, isVetClinic?: boolean }) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState("")
  const [resendError, setResendError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [showSuccessSplash, setShowSuccessSplash] = useState(false)
  const [showApprovalSplash, setShowApprovalSplash] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const response = await fetch("http://localhost:8080/api/otp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(true)
        // Check if this is a pet owner or vet clinic
        if (data.userType === 'pet_owner' && !data.requiresApproval) {
          setShowSuccessSplash(true)
        } else {
          setShowApprovalSplash(true)
        }
      } else {
        setError(data.message || "OTP verification failed")
      }
    } catch {
      setError("An error occurred. Please try again.")
    }
    setLoading(false)
  }

  // Resend OTP handler
  const handleResend = async () => {
    setResendLoading(true)
    setResendError("")
    setResendSuccess("")
    try {
      const response = await fetch("http://localhost:8080/api/otp/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (response.ok) {
        setResendSuccess("OTP resent! Check your email.")
        setCooldown(30)
      } else {
        setResendError(data.message || "Could not resend OTP.")
      }
    } catch {
      setResendError("An error occurred. Try again later.")
    }
    setResendLoading(false)
  }

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  return (
    <div className="flex flex-col items-center justify-center min-h-[250px]">
      {showSuccessSplash ? (
        <SuccessSplash />
      ) : showApprovalSplash ? (
        <ApprovalSplash />
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>Enter the OTP sent to <span className="font-medium">{email}</span></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                minLength={6}
                required
                placeholder="Enter 6-digit OTP"
                className="tracking-widest text-center font-mono text-lg"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <div className="flex flex-col items-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-1"
                  onClick={handleResend}
                  disabled={resendLoading || cooldown > 0}
                >
                  {resendLoading ? "Resending..." : cooldown > 0 ? `Resend OTP (${cooldown})` : "Resend OTP"}
                </Button>
                {resendError && <div className="text-red-500 text-xs">{resendError}</div>}
                {resendSuccess && <div className="text-green-600 text-xs">{resendSuccess}</div>}
              </div>
              {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
