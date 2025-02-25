const express = require("express");
const router = express.Router();
const appointmentController = require("../controller/appointmentController");
const availabilityController = require("../controller/availabilityController");
const { verifyToken, isPatient, isSpecialist } = require("../middleware/authMiddleware");

////////////////////////////////////////////////////////////
// Appointment Routes

// Check the time Slot Available 
router.get('/available-slots/:specialistId/:date', verifyToken, isPatient, appointmentController.getAvailableTimeSlots);

// Create a new appointment (Patient only)
router.post("/create-appointment", verifyToken, isPatient, appointmentController.createAppointment);

// Get all appointments for a patient (Patient only)
router.get("/patient/:patientId", verifyToken, isPatient, appointmentController.getPatientAppointments);

// Get all appointments for a specialist (Specialist only)
router.get("/specialist/:specialistId", verifyToken, isSpecialist, appointmentController.getSpecialistAppointments);

// Specialist accepts an appointment (Specialist only)
router.put("/:appointmentId/accept", verifyToken, isSpecialist, appointmentController.acceptAppointment);

// Specialist declines an appointment (Specialist only)
router.put("/:appointmentId/decline", verifyToken, isSpecialist, appointmentController.declineAppointment);

// Specialist completes an appointment (Specialist only)
router.post("/:appointmentId/complete", verifyToken, isSpecialist, appointmentController.completeAppointment);

// Get all list of completed appointment (Both Users)
router.get("/appointments/completed/:userId", appointmentController.getCompletedAppointments);

// Create a new appointment (Patient only)
router.post("/create-appointment", verifyToken, isPatient, appointmentController.createAppointment);

////////////////////////////////////////////////////////////
// Availability Routes
router.get("/specialist/:specialistId/availability", verifyToken, availabilityController.getAvailableDaysAndSlots); 
router.post("/specialist/:specialistId", verifyToken, isSpecialist, availabilityController.setAvailableDaysAndSlots); 

module.exports = router;