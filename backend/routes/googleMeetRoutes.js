const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/config');
const { createGoogleMeet } = require('../utils/googleMeet');
const { sendMeetLinkEmail, generateMeetEmailTemplate } = require('../utils/emailService');

// Direct authentication redirect (what frontend expects)
router.get('/auth', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });

    // Redirect user directly to Google OAuth
    res.redirect(authUrl);
});

// Get OAuth2 URL for authentication (JSON response)
router.get('/auth-url', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });

    res.json({ authUrl });
});

// Handle OAuth2 callback (Google redirects here)
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        // For popup authentication, send a simple HTML page that communicates back to parent
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Authentication Success</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f5f5f5;
                }
                .success { 
                    color: #4CAF50; 
                    font-size: 18px;
                    margin-bottom: 20px;
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 2s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="success">✅ Google Authentication Successful!</div>
            <div class="spinner"></div>
            <p>Returning to application...</p>
            
            <script>
                try {
                    // Store tokens in localStorage for the main window to access
                    localStorage.setItem('google_oauth_tokens', '${JSON.stringify(tokens).replace(/'/g, "\\'")}');
                    
                                         // Send message to parent window
                     if (window.opener) {
                         window.opener.postMessage({
                             type: 'google-auth-success',
                             tokens: ${JSON.stringify(tokens)}
                         }, 'http://localhost:3000');
                     }
                    
                    // Close popup after a short delay
                    setTimeout(() => {
                        window.close();
                    }, 1500);
                } catch (error) {
                    console.error('Error in OAuth callback:', error);
                                         if (window.opener) {
                         window.opener.postMessage({
                             type: 'google-auth-error',
                             error: 'Failed to process authentication'
                         }, 'http://localhost:3000');
                     }
                    window.close();
                }
            </script>
        </body>
        </html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('OAuth2 callback error:', error);
        
        // Send error page for popup
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Authentication Error</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f5f5f5;
                }
                .error { 
                    color: #f44336; 
                    font-size: 18px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="error">❌ Authentication Failed</div>
            <p>${error.message}</p>
            <p>This window will close automatically...</p>
            
            <script>
                try {
                                         if (window.opener) {
                         window.opener.postMessage({
                             type: 'google-auth-error',
                             error: '${error.message.replace(/'/g, "\\'")}'
                         }, 'http://localhost:3000');
                     }
                    
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                } catch (e) {
                    window.close();
                }
            </script>
        </body>
        </html>`;
        
        res.send(errorHtml);
    }
});

// Handle OAuth2 callback (alternative endpoint for backward compatibility)
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        // Store tokens in session or send them back to frontend
        // For now, we'll redirect to a success page with tokens in the URL
        // In production, you should store these securely in the database
        const tokenString = encodeURIComponent(JSON.stringify(tokens));
        
        // Redirect back to the frontend with success and tokens
        res.redirect(`http://localhost:3000/dashboard/doctor/video-consultation?google_auth=success&tokens=${tokenString}`);
        
    } catch (error) {
        console.error('OAuth2 callback error:', error);
        // Redirect back to frontend with error
        res.redirect(`http://localhost:3000/dashboard/doctor/video-consultation?google_auth=error&message=${encodeURIComponent(error.message)}`);
    }
});

// Create a meeting (frontend expects this endpoint)
router.post('/create-meet', async (req, res) => {
    try {
        const { tokens, summary, description, startTime, endTime } = req.body;
        
        // Check if tokens are provided
        if (!tokens) {
            return res.status(400).json({
                success: false,
                error: 'Google OAuth tokens are required. Please authenticate first.'
            });
        }

        const result = await createGoogleMeet({
            summary: summary || 'Online Consultation',
            description: description || '',
            startTime: startTime || new Date().toISOString(),
            endTime: endTime || new Date(Date.now() + 30 * 60000).toISOString(),
            tokens
        });

        res.json({
            success: true,
            meetLink: result.meetLink,
            eventDetails: result.event
        });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create a meeting (alternative endpoint for backward compatibility)
router.post('/create-meeting', async (req, res) => {
    try {
        const { tokens, summary, description, startTime, endTime } = req.body;
        const result = await createGoogleMeet({
            summary: summary || 'Online Consultation',
            description: description || '',
            startTime: startTime || new Date().toISOString(),
            endTime: endTime || new Date(Date.now() + 30 * 60000).toISOString(),
            tokens
        });

        res.json({
            success: true,
            meetLink: result.meetLink,
            eventDetails: result.event
        });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send email notifications with Meet link
router.post('/send-notifications', async (req, res) => {
    try {
        const {
            appointmentId,
            meetLink,
            petOwnerEmail,
            petOwnerName,
            clinicEmail,
            clinicName,
            petName,
            appointmentTime
        } = req.body;

        if (!meetLink || !petOwnerEmail || !clinicEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required email information'
            });
        }

        // Generate email content using our email service
        const petOwnerEmailContent = generateMeetEmailTemplate({
            recipientName: petOwnerName,
            petName: petName,
            appointmentTime: appointmentTime,
            meetLink: meetLink,
            senderName: clinicName,
            isForClinic: false
        });

        const clinicEmailContent = generateMeetEmailTemplate({
            recipientName: petOwnerName,
            petName: petName,
            appointmentTime: appointmentTime,
            meetLink: meetLink,
            senderName: clinicName,
            isForClinic: true
        });

        // Send emails using real email service
        console.log('📧 Sending Google Meet link emails...');
        
        const emailResults = await Promise.allSettled([
            sendMeetLinkEmail({
                to: petOwnerEmail,
                subject: `🎥 Google Meet Link for ${petName}'s Consultation - ${clinicName}`,
                htmlContent: petOwnerEmailContent
            }),
            sendMeetLinkEmail({
                to: clinicEmail,
                subject: `🎥 Google Meet Link for ${petName}'s Consultation with ${petOwnerName}`,
                htmlContent: clinicEmailContent,
                isClinic: true
            })
        ]);

        // Check results
        const successfulEmails = [];
        const failedEmails = [];

        emailResults.forEach((result, index) => {
            const email = index === 0 ? petOwnerEmail : clinicEmail;
            if (result.status === 'fulfilled' && result.value.success) {
                successfulEmails.push(email);
            } else {
                failedEmails.push({
                    email,
                    error: result.status === 'rejected' ? result.reason : result.value.error
                });
            }
        });

        if (successfulEmails.length > 0) {
            console.log(`✅ Emails sent successfully to: ${successfulEmails.join(', ')}`);
        }
        
        if (failedEmails.length > 0) {
            console.log(`❌ Failed to send emails:`, failedEmails);
        }

        res.json({
            success: true,
            message: `Email notifications processed. Sent to ${successfulEmails.length} recipients.`,
            sentTo: successfulEmails,
            failed: failedEmails.length > 0 ? failedEmails : undefined
        });

    } catch (error) {
        console.error('Send notifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 