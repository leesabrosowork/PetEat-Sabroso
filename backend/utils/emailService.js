const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'PRLD.PetEat@gmail.com',
    pass: process.env.EMAIL_PASS || 'ytpk xszd ixhj edvx'
  }
});

// Email templates
const emailTemplates = {
  bookingApproved: {
    subject: (clinicName, petName) => `Booking Approved - ${clinicName} - ${petName}`,
    userBody: (data) => {
      if (data.type === 'online') {
        // Online consultation template
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Booking Confirmed! 🎉</h2>
            <p>Dear ${data.petOwnerName},</p>
            <p>Great news! Your online consultation with <strong>${data.clinicName}</strong> has been approved.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Appointment Details</h3>
              <p><strong>Pet:</strong> ${data.petName}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> Online Consultation</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            ${data.googleMeetLink ? `
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #27ae60; margin-top: 0;">Join Your Video Consultation</h3>
                <p>Your Google Meet link is ready! Click the button below to join your consultation:</p>
                <a href="${data.googleMeetLink}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
                  🎥 Join Video Call
                </a>
                <p style="font-size: 14px; color: #666;">Or copy this link: ${data.googleMeetLink}</p>
              </div>
            ` : `
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">Online Consultation</h3>
                <p>The Google Meet link will be sent to you as soon as it is ready.</p>
              </div>
            `}
            <p>If you have any questions, please contact the clinic directly.</p>
            <p>Best regards,<br>The PetEat Team</p>
          </div>
        `;
      } else {
        // In-person visit template
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Booking Confirmed! 🎉</h2>
            <p>Dear ${data.petOwnerName},</p>
            <p>Great news! Your in-person appointment with <strong>${data.clinicName}</strong> has been approved.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Appointment Details</h3>
              <p><strong>Pet:</strong> ${data.petName}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> In-Person Visit</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">In-Person Visit</h3>
              <p>Please arrive at the clinic 10 minutes before your scheduled time.</p>
              <p><strong>Clinic Address:</strong> ${data.clinicAddress || 'Contact clinic for address'}</p>
            </div>
            <p>If you have any questions, please contact the clinic directly.</p>
            <p>Best regards,<br>The PetEat Team</p>
          </div>
        `;
      }
    },
    clinicBody: (data) => {
      if (data.type === 'online') {
        // Online consultation template for clinic
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Online Consultation Confirmed 📅</h2>
            <p>Dear ${data.clinicName} Team,</p>
            <p>A new online consultation has been confirmed for your clinic.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Booking Details</h3>
              <p><strong>Pet Owner:</strong> ${data.petOwnerName}</p>
              <p><strong>Pet:</strong> ${data.petName}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> Online Consultation</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>Contact:</strong> ${data.petOwnerEmail}</p>
            </div>
            ${data.googleMeetLink ? `
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #27ae60; margin-top: 0;">Video Consultation Link</h3>
                <p>Google Meet link for this consultation:</p>
                <a href="${data.googleMeetLink}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
                  🎥 Join Video Call
                </a>
                <p style="font-size: 14px; color: #666;">Or copy this link: ${data.googleMeetLink}</p>
              </div>
            ` : `
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">Online Consultation</h3>
                <p>The Google Meet link will be sent to you as soon as it is ready.</p>
              </div>
            `}
            <p>Please ensure all necessary preparations are made for this appointment.</p>
            <p>Best regards,<br>The PetEat Team</p>
          </div>
        `;
      } else {
        // In-person visit template for clinic
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New In-Person Booking Confirmed 📅</h2>
            <p>Dear ${data.clinicName} Team,</p>
            <p>A new in-person booking has been confirmed for your clinic.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Booking Details</h3>
              <p><strong>Pet Owner:</strong> ${data.petOwnerName}</p>
              <p><strong>Pet:</strong> ${data.petName}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> In-Person Visit</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>Contact:</strong> ${data.petOwnerEmail}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">In-Person Visit</h3>
              <p>Please prepare for an in-person consultation.</p>
            </div>
            <p>Please ensure all necessary preparations are made for this appointment.</p>
            <p>Best regards,<br>The PetEat Team</p>
          </div>
        `;
      }
    }
  }
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'PRLD.PetEat@gmail.com',
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send booking approval emails
const sendBookingApprovalEmails = async (bookingData) => {
  try {
    const { 
      petOwnerEmail, 
      petOwnerName, 
      clinicEmail, 
      clinicName, 
      petName, 
      bookingDate, 
      appointmentTime, 
      type, 
      reason, 
      googleMeetLink,
      clinicAddress 
    } = bookingData;

    // Send email to pet owner
    const userEmailResult = await sendEmail(
      petOwnerEmail,
      emailTemplates.bookingApproved.subject(clinicName, petName),
      emailTemplates.bookingApproved.userBody({
        petOwnerName,
        clinicName,
        petName,
        bookingDate,
        appointmentTime,
        type,
        reason,
        googleMeetLink,
        clinicAddress
      })
    );

    // Send email to clinic
    const clinicEmailResult = await sendEmail(
      clinicEmail,
      emailTemplates.bookingApproved.subject(clinicName, petName),
      emailTemplates.bookingApproved.clinicBody({
        petOwnerName,
        petOwnerEmail,
        clinicName,
        petName,
        bookingDate,
        appointmentTime,
        type,
        reason,
        googleMeetLink
      })
    );

    return {
      userEmail: userEmailResult,
      clinicEmail: clinicEmailResult
    };
  } catch (error) {
    console.error('❌ Failed to send booking approval emails:', error);
    return {
      userEmail: { success: false, error: error.message },
      clinicEmail: { success: false, error: error.message }
    };
  }
};

module.exports = {
  sendEmail,
  sendBookingApprovalEmails,
  emailTemplates
}; 