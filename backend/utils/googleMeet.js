const { google } = require('googleapis');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/config');

// This function expects a valid OAuth2 token for the user (doctor/clinic)
async function createGoogleMeet({ summary, description, startTime, endTime, tokens }) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = {
    summary: summary || 'Online Consultation',
    description: description || '',
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    conferenceData: {
      createRequest: { requestId: Math.random().toString(36).substring(2) },
    },
    visibility: 'public',
    guestsCanInviteOthers: true,
    guestsCanSeeOtherGuests: true,
  };
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });
  const meetLink = response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
  return { meetLink, event: response.data };
}

module.exports = { createGoogleMeet }; 