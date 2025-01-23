const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { verifyToken, isPatient, isSpecialist } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.post('/verify-otp', authController.verifyOTP);

// Protected Routes
router.get('/profile', verifyToken, authController.getProfile); 
router.put('/profile', verifyToken, authController.editProfile); 
router.get('/specialists', verifyToken, authController.getSpecialistList); 
router.get('/patient-data', verifyToken, isPatient, authController.getPatientData); 

module.exports = router;
