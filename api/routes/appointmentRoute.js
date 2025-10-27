const express = require("express");
const router = express.Router();
const appointmentController = require("../controller/appointmentController");
const availabilityController = require("../controller/availabilityController");
const { verifyToken, isPatient, isSpecialist } = require("../middleware/authMiddleware");

////////////////////////////////////////////////////////////
// Appointment Routes

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

// Cancel Appointment (Both Users)
router.put("/:appointmentId/cancel", verifyToken, isSpecialistOrPatient, appointmentController.cancelAppointment);

// Reschedule Appointment (Both Users)
router.put("/:appointmentId/reschedule", verifyToken, isSpecialistOrPatient, appointmentController.rescheduleAppointment);

// Get weekly completed appointments (Specialist)
router.get("/completed/weekly/:specialistId", verifyToken, appointmentController.getWeeklyCompletedAppointments);

////////////////////////////////////////////////////////////
// Availability Routes
router.get("/specialist/:specialistId/availability", verifyToken, availabilityController.getAvailableDaysAndSlots); 
router.post("/specialist/:specialistId", verifyToken, isSpecialist, availabilityController.setAvailableDaysAndSlots); 

module.exports = router;
