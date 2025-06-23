const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const VetClinic = require('../models/vetClinicModel');

// Get all conversations for the logged-in user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'fullName clinicName email role profilePicture'
      })
      .sort({ lastMessageDate: -1 });
    
    // Format the response data
    const formattedConversations = conversations.map(conv => {
      // Find the other participant (not the current user)
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessageText: conv.lastMessageText,
        lastMessageDate: conv.lastMessageDate,
        unreadCount: conv.unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ 
      success: true, 
      data: formattedConversations 
    });
  } catch (err) {
    console.error('Error in getConversations:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations',
      error: err.message 
    });
  }
};

// Start a new conversation (or return existing)
exports.startConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { clinicId, ownerId } = req.body;
    
    // Check if request is from pet owner or clinic
    const isPetOwner = req.user.role === 'pet owner' || req.user.role === 'pet_owner' || 
                       req.user.userType === 'pet_owner' || req.user.role === 'user';
    const isClinic = req.user.role === 'clinic' || req.user.role === 'vet clinic';
    
    // Validate required parameters
    if (isPetOwner && !clinicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Clinic ID is required when pet owner starts a conversation' 
      });
    }
    
    if (isClinic && !ownerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Owner ID is required when clinic starts a conversation' 
      });
    }
    
    // Set the other participant ID based on who is initiating
    const otherParticipantId = isPetOwner ? clinicId : ownerId;
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherParticipantId] }
    });
    
    // If not, create a new conversation
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherParticipantId],
        lastMessageDate: new Date()
      });
      
      // Populate participants for response
      conversation = await Conversation.findById(conversation._id)
        .populate({
          path: 'participants',
          select: 'fullName clinicName email role userType profilePicture username'
        });
    }
    
    res.json({ 
      success: true, 
      data: conversation 
    });
  } catch (err) {
    console.error('Error in startConversation:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start conversation',
      error: err.message 
    });
  }
};

// Get all messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found or you are not a participant' 
      });
    }
    
    // Get messages and populate sender info
    const messages = await Message.find({ conversation: conversationId })
      .populate({
        path: 'sender',
        select: 'fullName clinicName email role profilePicture'
      })
      .sort({ createdAt: 1 });
    
    // Mark messages as read if they were sent to this user
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: userId },
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    // Reset unread count for this conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      { unreadCount: 0 }
    );
    
    res.json({ 
      success: true, 
      data: messages 
    });
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages',
      error: err.message 
    });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }
    
    // Verify the conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId
    });
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found or you are not a participant' 
      });
    }
    
    // Create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: text.trim()
    });
    
    // Get the populated message to return
    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'fullName clinicName email role profilePicture'
      });
    
    // Update the conversation with last message info
    // Find the recipient (not the sender)
    const recipient = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );
    
    await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        lastMessage: message._id,
        lastMessageText: text.trim(),
        lastMessageDate: new Date(),
        // Increment unread count for the recipient
        $inc: { unreadCount: 1 }
      }
    );
    
    // TODO: Socket.IO will handle real-time delivery
    // TODO: Twilio integration for SMS notifications (optional)
    
    res.json({ 
      success: true, 
      data: populatedMessage 
    });
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: err.message 
    });
  }
};

// Get all clinics for the inbox or pet owners if user is a clinic
exports.getAllClinics = async (req, res) => {
  try {
    const isPetOwner = req.user.role === 'pet owner' || req.user.role === 'pet_owner' || 
                       req.user.userType === 'pet_owner' || req.user.role === 'user';
    const isClinic = req.user.role === 'clinic' || req.user.role === 'vet clinic';
    
    if (isPetOwner) {
      // Get clinics from both User model (role: clinic) and VetClinic model
      const userClinics = await User.find({ role: 'clinic' })
        .select('_id fullName clinicName email profilePicture');
      
      const vetClinics = await VetClinic.find({ status: 'approved' })
        .select('_id fullName clinicName email');
      
      // Format vet clinics to match user schema
      const formattedVetClinics = vetClinics.map(clinic => ({
        _id: clinic._id,
        fullName: clinic.fullName,
        clinicName: clinic.clinicName,
        email: clinic.email,
        role: 'vet clinic'
      }));
      
      // Combine both sets of clinics
      const allClinics = [...userClinics, ...formattedVetClinics];
      
      res.json({ 
        success: true, 
        data: { clinics: allClinics } 
      });
    } else if (isClinic) {
      // Get all pet owners for clinics to message using both schema formats
      const petOwners = await User.find({
        $or: [
          { role: { $in: ['pet owner', 'pet_owner', 'user'] } },
          { userType: 'pet_owner' }
        ]
      }).select('_id fullName username email profilePicture');
      
      res.json({ 
        success: true, 
        data: { clinics: petOwners } 
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
  } catch (err) {
    console.error('Error in getAllClinics:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch clinics',
      error: err.message 
    });
  }
}; 