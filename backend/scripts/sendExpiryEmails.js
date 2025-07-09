const mongoose = require('mongoose');
const Inventory = require('../models/inventoryModel');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const config = require('../config/config');

async function sendExpiryEmails() {
  await mongoose.connect(config.mongoURI);
  const clinics = await User.find({ role: 'clinic', email: { $ne: null } });
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  for (const clinic of clinics) {
    const items = await Inventory.find({
      expirationDate: { $lte: soon, $gte: new Date() },
      clinic: clinic._id
    });
    if (items.length === 0) continue;
    const transporter = nodemailer.createTransport(config.email);
    const html = `<h2>Expiring Inventory Items</h2><ul>${items.map(i => `<li>${i.item} (${i.category}) - Expires: ${i.expirationDate.toLocaleDateString()}</li>`).join('')}</ul>`;
    await transporter.sendMail({
      from: config.email.auth.user,
      to: clinic.email,
      subject: 'Inventory Items Near Expiry',
      html
    });
    console.log(`Sent expiry email to ${clinic.email}`);
  }
  await mongoose.disconnect();
}

module.exports = sendExpiryEmails;

if (require.main === module) {
  sendExpiryEmails().then(() => process.exit(0));
} 