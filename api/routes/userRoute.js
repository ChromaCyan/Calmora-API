const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const adminController = require('../controller/adminController');
const { verifyToken, isPatient, isSpecialist, isAdmin } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.createUser);
router.post('/send-verification-otp', authController.sendVerificationOTP); 
router.post('/login', authController.loginUser);
router.post('/verify-otp', authController.verifyOTP);

// Protected Routes
router.get('/profile', verifyToken, authController.getProfile); 
router.put('/profile', verifyToken, authController.editProfile); 
router.get('/specialists', verifyToken, authController.getSpecialistList); 
router.get('/patient-data', verifyToken, isPatient, authController.getPatientData); 

// Admin Routes (Managing Specialist)
router.get('/admin/specialists', verifyToken, isAdmin, adminController.getAllSpecialists);
router.get('/admin/specialists/pending', verifyToken, isAdmin, adminController.getPendingSpecialists);
router.get('/admin/specialists/:specialistId', verifyToken, isAdmin, adminController.getSpecialistById);
router.put('/admin/specialists/:specialistId/approve', verifyToken, isAdmin, adminController.approveSpecialist);
router.put('/admin/specialists/:specialistId/reject', verifyToken, isAdmin, adminController.rejectSpecialist);
router.put('/admin/specialists/:specialistId', verifyToken, isAdmin, adminController.deleteSpecialist);
router.get('/admin/articles/pending', verifyToken, isAdmin, adminController.getPendingArticles);
router.get('/admin/articles/approved/:articleId', verifyToken, isAdmin, adminController.getApprovedArticleById);
router.put('/admin/articles/:articleId/approve', verifyToken, isAdmin, adminController.approveArticle);
router.put('/admin/articles/:articleId/reject', verifyToken, isAdmin, adminController.rejectArticle);
router.put('/admin/articles/:articleId/unpublish', verifyToken, isAdmin, adminController.unpublishArticle);

// Fetch a specialist by ID
router.get('/specialists/:specialistId', verifyToken, authController.getSpecialistById);

// Forget Password
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/verify-reset-otp", authController.verifyResetOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
