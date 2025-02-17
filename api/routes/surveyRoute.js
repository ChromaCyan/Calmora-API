const express = require("express");
const router = express.Router();
const surveyController = require("../controller/surveyController");
const { verifyToken, isPatient, isSpecialist, isAdmin } = require("../middleware/authMiddleware");

// Create a new survey
router.post("/create", verifyToken, isAdmin, surveyController.createSurvey);

// Submit survey response
router.post("/submit", verifyToken, isPatient, surveyController.submitSurveyResponse);

// Get All Survey
router.get("/all", surveyController.getSurveys);

// Get survey results for a patient
router.get("/results/:patientId", verifyToken, isPatient,surveyController.getPatientSurveyResults);

// Get articles based on survey results
router.get("/patient/:id/recommended-articles", verifyToken, isPatient, surveyController.getRecommendedArticles);

module.exports = router;
