const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be a user with role: 'clinic'
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  // For future: attachments, media, etc.
}, { timestamps: true });

// Create indexes for faster queries
messageSchema.index({ conversation: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message; 