"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Video, Clock, Mail, CheckCircle, AlertCircle } from "lucide-react"

interface GoogleMeetDialogProps {
  open: boolean
  onClose: () => void
  appointment: any
  onSuccess?: () => void
}

export default function GoogleMeetDialog({
  open,
  onClose,
  appointment,
  onSuccess
}: GoogleMeetDialogProps) {
  // Debug appointment data
  console.log('🔍 GoogleMeetDialog received appointment:', {
    appointment,
    startTime: appointment?.startTime,
    endTime: appointment?.endTime,
    hasStartTime: !!appointment?.startTime,
    hasEndTime: !!appointment?.endTime
  });

  const [step, setStep] = useState<'auth' | 'generating' | 'sending' | 'success'>('auth')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const [googleTokens, setGoogleTokens] = useState<any>(null)

  // Reset state when dialog opens
  useEffect(() => {
    console.log('🎯 GoogleMeetDialog open prop changed:', open);
    if (open) {
      console.log('✅ Dialog is opening, resetting state...');
      setStep('auth')
      setProgress(0)
      setError(null)
      setMeetLink(null)
      setGoogleTokens(null)
    }
  }, [open])

  const handleGoogleAuth = async () => {
    try {
      setError(null)
      
      // Get auth URL from backend
      const response = await fetch('http://localhost:8080/api/google-meet/auth-url')
      const data = await response.json()
      
      if (!response.ok || !data.authUrl) {
        throw new Error('Failed to get Google auth URL')
      }

      // Open popup window for Google OAuth
      const popup = window.open(
        data.authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.')
      }

      // Listen for the popup to close or receive tokens
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          console.log('Popup closed, checking localStorage for tokens...')
          
          // Check if we got tokens from localStorage (set by the callback)
          const tokens = localStorage.getItem('google_oauth_tokens')
          console.log('Tokens in localStorage:', tokens ? 'Found' : 'Not found')
          
          if (tokens) {
            try {
              const parsedTokens = JSON.parse(tokens)
              console.log('✅ Using tokens from localStorage')
              setGoogleTokens(parsedTokens)
              localStorage.removeItem('google_oauth_tokens') // Clean up
              
              // Automatically proceed to generate Meet link
              setTimeout(() => handleGenerateMeet(parsedTokens), 500)
            } catch (e) {
              console.error('❌ Failed to parse tokens from localStorage:', e)
              setError('Failed to parse authentication tokens')
            }
          } else {
            console.log('❌ No tokens found, authentication likely cancelled')
            setError('Authentication was cancelled or failed')
          }
        }
      }, 1000)

      // Also listen for postMessage from popup
      const handleMessage = (event: MessageEvent) => {
        console.log('Received message from popup:', event.data, 'from origin:', event.origin)
        
        // Allow messages from backend (where the callback is handled)
        if (event.origin !== 'http://localhost:8080' && event.origin !== window.location.origin) {
          console.log('Ignoring message from unknown origin:', event.origin)
          return
        }
        
        if (event.data.type === 'google-auth-success' && event.data.tokens) {
          console.log('✅ Google auth success received!', event.data.tokens)
          clearInterval(checkClosed)
          popup.close()
          setGoogleTokens(event.data.tokens)
          
          // Automatically proceed to generate Meet link
          setTimeout(() => handleGenerateMeet(event.data.tokens), 500)
          
          window.removeEventListener('message', handleMessage)
        } else if (event.data.type === 'google-auth-error') {
          console.log('❌ Google auth error received:', event.data.error)
          clearInterval(checkClosed)
          popup.close()
          setError(event.data.error || 'Authentication failed')
          window.removeEventListener('message', handleMessage)
        }
      }

      window.addEventListener('message', handleMessage)

    } catch (error: any) {
      setError(error.message || 'Failed to start Google authentication')
    }
  }

  const handleGenerateMeet = async (tokens?: any) => {
    const tokensToUse = tokens || googleTokens
    if (!tokensToUse || !appointment) {
      setError('Missing authentication tokens or appointment data')
      return
    }

    setStep('generating')
    setProgress(25)
    setError(null)

    try {
      // Validate appointment times
      const startTime = appointment.startTime;
      const endTime = appointment.endTime;
      
      if (!startTime || !endTime) {
        throw new Error('Invalid appointment times - missing start or end time');
      }
      
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid appointment times - cannot parse dates');
      }
      
      if (endDate <= startDate) {
        throw new Error('Invalid appointment times - end time must be after start time');
      }
      
      console.log(`📅 Creating Google Meet with times:`, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) + ' minutes'
      });
      
      // Create the meet link
      const res = await fetch("http://localhost:8080/api/google-meet/create-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens: tokensToUse,
          summary: `Video Consultation for ${appointment.pet?.name || 'Pet'}`,
          description: `Online consultation for ${appointment.pet?.name || 'Pet'} with ${appointment.user?.name || 'Owner'}`,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create Google Meet link.")
      }
      
      const data = await res.json()
      setMeetLink(data.meetLink)
      setProgress(50)
      
      // Save the Meet link to appointment
      await saveMeetLinkToAppointment(data.meetLink)
      setProgress(75)
      
      // Send email notifications
      setStep('sending')
      await sendEmailNotifications(data.meetLink)
      setProgress(100)
      
      // Success!
      setStep('success')
      onSuccess?.()
      
    } catch (e: any) {
      setError(e.message || "Failed to create Google Meet link.")
      setStep('auth') // Go back to auth step on error
      setProgress(0)
    }
  }

  // Save Meet link to appointment
  const saveMeetLinkToAppointment = async (meetLink: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:8080/api/bookings/${appointment?._id}/google-meet-link`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ googleMeetLink: meetLink }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to save Meet link to appointment")
      }
    } catch (error) {
      console.error("Error saving Meet link:", error)
    }
  }

  // Send email notifications
  const sendEmailNotifications = async (meetLink: string) => {
    try {
      // Prepare email data - only include clinic email if it's valid
      const emailData: any = {
        appointmentId: appointment?._id,
        meetLink: meetLink,
        petOwnerEmail: appointment?.user?.email,
        petOwnerName: appointment?.user?.name,
        clinicName: appointment?.clinic?.clinicName || 'Veterinary Clinic',
        petName: appointment?.pet?.name,
        appointmentTime: appointment?.startTime
      };

      // Only add clinic email if it exists and is valid
      const clinicEmail = appointment?.clinic?.email;
      if (clinicEmail && clinicEmail.includes('@') && clinicEmail.includes('.') && !clinicEmail.includes('example.com')) {
        emailData.clinicEmail = clinicEmail;
      } else {
        console.log('⚠️ Using default clinic email - no valid clinic email found');
        // Use PRLD.PetEat@gmail.com as the default clinic email
        emailData.clinicEmail = 'PRLD.PetEat@gmail.com';
      }

      console.log('📧 Sending email notifications with data:', emailData);

      const res = await fetch("http://localhost:8080/api/google-meet/send-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      if (!res.ok) {
        throw new Error("Failed to send email notifications")
      }

      console.log("✅ Email notifications sent successfully!")
    } catch (error) {
      console.error("❌ Failed to send email notifications:", error)
      // Don't fail the whole process for email errors
    }
  }

  const handleClose = () => {
    setStep('auth')
    setProgress(0)
    setError(null)
    setMeetLink(null)
    setGoogleTokens(null)
    onClose()
  }

  const getStepIcon = () => {
    switch (step) {
      case 'auth':
        return <Video className="h-6 w-6" />
      case 'generating':
        return <Clock className="h-6 w-6 animate-spin" />
      case 'sending':
        return <Mail className="h-6 w-6 animate-pulse" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'auth':
        return 'Authenticate with Google'
      case 'generating':
        return 'Creating Google Meet Link'
      case 'sending':
        return 'Sending Email Notifications'
      case 'success':
        return 'Success! Meet Link Created'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 'auth':
        return 'Click below to authenticate with Google and create a Meet link for this consultation.'
      case 'generating':
        return 'Generating your Google Meet link and calendar event...'
      case 'sending':
        return 'Sending email notifications to both parties with the Meet link...'
      case 'success':
        return 'Google Meet link has been created and emails sent successfully!'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon()}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Info */}
          <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Pet: {appointment?.pet?.name || 'Unknown'}</span>
              <Badge variant="outline">Video Consultation</Badge>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Owner: {appointment?.user?.name || 'Unknown'}
            </div>
            {appointment?.startTime && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time: {new Date(appointment.startTime).toLocaleString()}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {step !== 'auth' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Meet Link (Success) */}
          {step === 'success' && meetLink && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                Google Meet Link Created!
              </div>
              <a 
                href={meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
              >
                {meetLink}
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {step === 'auth' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGoogleAuth} disabled={!appointment}>
                  Authenticate with Google
                </Button>
              </>
            )}
            
            {step === 'success' && (
              <>
                {meetLink && (
                  <Button variant="outline" asChild>
                    <a href={meetLink} target="_blank" rel="noopener noreferrer">
                      Join Meet Now
                    </a>
                  </Button>
                )}
                <Button onClick={handleClose}>
                  Done
                </Button>
              </>
            )}
            
            {(step === 'generating' || step === 'sending') && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 