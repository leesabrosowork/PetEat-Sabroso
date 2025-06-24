const axios = require('axios');

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';
const ZOOM_USER_ID = process.env.ZOOM_USER_ID; // The Zoom user ID or email to create meetings for
const ZOOM_ACCESS_TOKEN = process.env.ZOOM_ACCESS_TOKEN; // OAuth access token

async function createZoomMeeting({ topic = 'Video Consultation', start_time, duration = 30 }) {
  try {
    const response = await axios.post(
      `${ZOOM_API_BASE_URL}/users/${ZOOM_USER_ID}/meetings`,
      {
        topic,
        type: 2, // Scheduled meeting
        start_time, // ISO 8601 format
        duration, // in minutes
        settings: {
          join_before_host: true,
          approval_type: 0,
          registration_type: 1,
          enforce_login: false,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ZOOM_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return {
      join_url: response.data.join_url,
      meeting_id: response.data.id,
      start_url: response.data.start_url,
    };
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
}

module.exports = {
  createZoomMeeting,
}; 