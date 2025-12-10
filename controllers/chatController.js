import Chat from '../models/Chat.js';

// Get messages for a booking
export const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
   const messages = await Chat.find({ bookingId })
  .populate('senderId', 'name profileImage')
  .populate('receiverId', 'name profileImage')
  .sort({ timestamp: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { bookingId, receiverId, message } = req.body;
    const senderId = req.id;

    const newMessage = new Chat({
      bookingId,
      senderId,
      receiverId,
      message
    });

    await newMessage.save();
    await newMessage.populate('senderId', 'name profileImage');

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};