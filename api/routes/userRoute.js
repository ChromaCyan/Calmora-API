const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const adminController = require('../controller/adminController');
const { verifyToken, isPatient, isSpecialist, isAdmin } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.post('/verify-otp', authController.verifyOTP);
//router.put('/approve-specialist', verifyToken, authController.approveSpecialist);

// Protected Routes
router.get('/profile', verifyToken, authController.getProfile); 
router.put('/profile', verifyToken, authController.editProfile); 
router.get('/specialists', verifyToken, authController.getSpecialistList); 
router.get('/patient-data', verifyToken, isPatient, authController.getPatientData); 

// Admin Routes
router.get('/admin/specialists', verifyToken, isAdmin, adminController.getAllSpecialists);
router.get('/admin/specialists/pending', verifyToken, isAdmin, adminController.getPendingSpecialists); 
router.put('/admin/specialists/:specialistId/approve', verifyToken, isAdmin, adminController.approveSpecialist); 
router.put('/admin/specialists/:specialistId/reject', verifyToken, isAdmin, adminController.rejectSpecialist); 

// Fetch a specialist by ID
router.get('/specialists/:specialistId', verifyToken, authController.getSpecialistById);

// Forget Password
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/verify-reset-otp", authController.verifyResetOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
