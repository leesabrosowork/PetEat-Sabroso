const express = require('express');
const { google } = require('googleapis');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/config');
const router = express.Router();
const User = require('../models/userModel');

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// 1. Initiate OAuth2 flow
router.get('/auth', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
    'profile',
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
});

// 2. OAuth2 callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store tokens in DB for the authenticated user (clinic)
    let userId = req.user?._id; // If using authentication middleware
    if (!userId && req.session && req.session.userId) userId = req.session.userId; // fallback for demo
    if (userId) {
      await User.findByIdAndUpdate(userId, { googleTokens: tokens });
    } else {
      // fallback: store in session for demo
      req.session = req.session || {};
      req.session.googleTokens = tokens;
    }
    res.redirect('/api/google-meet/success');
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tokens', details: err.message });
  }
});

// 3. Success page (for demo)
router.get('/success', (req, res) => {
  res.send('Google authentication successful! You can now create Meet links.');
});

// 4. Create Calendar event with Meet link
router.post('/create-meet', async (req, res) => {
  // For demo: get tokens from session (in production, use DB)
  const tokens = req.session && req.session.googleTokens;
  if (!tokens) return res.status(401).json({ error: 'Not authenticated with Google' });
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const { summary, description, startTime, endTime } = req.body;
  try {
    const event = {
      summary: summary || 'Google Meet Appointment',
      description: description || '',
      start: { dateTime: startTime || new Date().toISOString() },
      end: { dateTime: endTime || new Date(Date.now() + 30 * 60 * 1000).toISOString() },
      conferenceData: {
        createRequest: { requestId: Math.random().toString(36).substring(2) },
      },
    };
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });
    const meetLink = response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
    res.json({ meetLink, event: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event', details: err.message });
  }
});

module.exports = router; 