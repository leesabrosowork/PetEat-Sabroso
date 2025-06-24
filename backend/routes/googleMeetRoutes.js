const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/config');
const { createGoogleMeet } = require('../utils/googleMeet');

// Get OAuth2 URL for authentication
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

// Handle OAuth2 callback
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        // In a real app, save these tokens securely with the user's data
        res.json({ success: true, tokens });
    } catch (error) {
        console.error('OAuth2 callback error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a meeting
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

module.exports = router; 