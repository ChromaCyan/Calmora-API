// routes/moodRoutes.js
const express = require('express');
const moodController = require('../controller/moodController');
const router = express.Router();
const { verifyToken, isPatient } = require("../middleware/authMiddleware");

// Mood entry routes
router.post('/create-mood',verifyToken, isPatient, moodController.createMood);
router.get('/mood-entries/:userId', verifyToken, isPatient, moodController.getMoods);

module.exports = router;