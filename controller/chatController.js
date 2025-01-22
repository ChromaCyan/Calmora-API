const Chat = require('../model/chatModel');

exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const userId = req.user.id; 

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found.' });

        chat.messages.push({ sender: userId, content });
        await chat.save();

        res.status(200).json({ message: 'Message sent.', chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
};

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
