// Dependency Imports
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Chat = require('./model/chatModel');
const initializeSocket = require("./socket/socket");

// Route Imports
const moodRoutes = require('./routes/moodRoutes');
const authRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const appointmentRoutes = require("./routes/appointmentRoute");
const surveyRoutes = require("./routes/surveyRoute");
const articleRoutes = require("./routes/articleRoute");
const notificationRoutes = require("./routes/notificationRoute");

// Important Imports
const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error: ", error));

const db = mongoose.connection.useDb("Armstrong");

// Use socket.io
initializeSocket(http.createServer(app));  // Use the HTTP server for socket.io

// Routes
app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/api", (req, res) => res.json({ message: "Hello from the API!" }));
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/notification", notificationRoutes);

// Export the app to allow Vercel to handle it
module.exports = app;
