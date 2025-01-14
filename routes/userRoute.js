const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { verifyToken, isPatient, isSpecialist } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.post('/verify-otp', authController.verifyOTP);

// Protected Routes
router.get('/profile', verifyToken, (req, res) => res.send(`Welcome, ${req.user.userType}!`));
router.get('/patient-data', verifyToken, isPatient, (req, res) => res.send('Patient-specific data'));
router.get('/specialist-data', verifyToken, isSpecialist, (req, res) => res.send('Specialist-specific data'));

module.exports = router;
