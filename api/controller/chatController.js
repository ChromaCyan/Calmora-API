const Chat = require('../model/chatModel');
const User = require('../model/userModel');
const { createNotification } = require("../controller/notificationController");

// Create a new chat session.
exports.createChat = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { recipientId } = req.body; 

        // Create a new chat session
        const newChat = new Chat({
            participants: [userId, recipientId], 
            messages: [], 
        });

        const savedChat = await newChat.save();

        res.status(200).json({ chatId: savedChat._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create a new chat.' });
    }
};

// Send message to existing chat
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const userId = req.user.id;

        console.log("Chat ID:", chatId);
        console.log("User ID:", userId);

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: "Chat not found." });

        const sender = await User.findById(userId);
        if (!sender) return res.status(404).json({ error: "Sender not found." });

        console.log("Sender:", sender);

        chat.messages.push({
            sender: userId,
            firstName: sender.firstName,
            lastName: sender.lastName,
            content,
        });

        await chat.save();

        // Get recipientId (other participant in chat)
        const recipientId = chat.participants.find((id) => id.toString() !== userId.toString());

        // Save notification for recipient
        if (recipientId) {
            await createNotification(recipientId, "chat", `New message from ${sender.firstName}`);
        }

        res.status(200).json({ message: "Message sent.", chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send message." });
    }
};

// Get Chat List
exports.getChatList = async (req, res) => {
    try {
        const userId = req.user.id; 
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'firstName lastName') 
            .select('participants messages') 
            .exec();

        const chatList = chats.map(chat => ({
            chatId: chat._id,
            participants: chat.participants.filter(p => p._id.toString() !== userId),
            lastMessage: chat.messages[chat.messages.length - 1],
        }));

        res.status(200).json(chatList);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat list.' });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId)
            .populate('messages.sender', 'firstName lastName') 
            .exec();

        if (!chat) return res.status(404).json({ error: 'Chat not found.' });

        res.status(200).json(chat.messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history.' });
    }
};
