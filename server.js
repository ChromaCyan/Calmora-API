//Dependency Imports
const express = require("express");
const http = require("http"); 
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Chat = require('./model/chatModel');
const initializeSocket = require("./socket/socket");

//Route Imports
const moodRoutes = require('./routes/moodRoutes');
const authRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const appointmentRoutes = require("./routes/appointmentRoute")
const surveyRoutes = require("./routes/surveyRoute")
const articleRoutes = require("./routes/articleRoute")

//Important Imports
const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error: ", error));

const db = mongoose.connection.useDb("Armstrong");

//Use socket.io
initializeSocket(server);

// Routes
app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/api", (req, res) => {
  res.json({ message: "Hello from the API!" });
});
//Chat API
app.use("/api/chat", chatRoutes);
//Authentication API
app.use("/api/auth", authRoutes);
//Appointment API
app.use("/api/appointment", appointmentRoutes);
//Mood API
app.use('/api/mood', moodRoutes);
//Survey API
app.use('/api/survey', surveyRoutes);
//Article API
app.use('/api/article', articleRoutes);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app };