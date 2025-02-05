const express = require("express");
const http = require("http"); 
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Chat = require('./model/chatModel');
const chatController = require('./controller/chatController'); 

dotenv.config();
//Route Imports
const moodRoutes = require('./routes/moodRoutes');
const authRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const appointmentRoutes = require("./routes/appointmentRoute")
const surveyRoutes = require("./routes/surveyRoute")

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error: ", error));

const db = mongoose.connection.useDb("Armstrong");

// Routes
app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/api", (req, res) => {
  res.json({ message: "Hello from the API!" });
});
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/survey', surveyRoutes);


//Socket End
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

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app };