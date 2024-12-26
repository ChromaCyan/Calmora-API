const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error: ", error));

// Use my Armstrong database in mongodb
const db = mongoose.connection.useDb("Armstrong");

// Message to start the API
app.listen(port, () => {
  console.log(`Server is running on http://192.168.100.134:${port}`);
});

module.exports = { app };
