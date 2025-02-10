const { Server } = require("socket.io");
const Chat = require("../model/chatModel");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("sendMessage", async (data) => {
      console.log("Message received: ", data);
      const { senderId, recipientId, message, chatId } = data;

      try {
        let chat = await Chat.findById(chatId);
        if (!chat) {
          chat = new Chat({
            _id: chatId,
            participants: [senderId, recipientId],
            messages: [],
          });
        }

        const newMessage = {
          sender: senderId,
          content: message,
          timestamp: new Date(),
        };

        chat.messages.push(newMessage);
        await chat.save();

        io.to(recipientId).emit("receiveMessage", { chatId, senderId, message: newMessage });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initializeSocket;
