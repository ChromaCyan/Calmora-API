const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const authRoutes = require("./routes/userRoute"); 

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error: ", error));

const db = mongoose.connection.useDb("Armstrong");

app.get("/", (req, res) => res.send("Express on Vercel")); 

app.get("/api", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

app.use("/api/auth", authRoutes); 

// Server Start Message
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app };
