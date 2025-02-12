const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");

// Route to fetch all specialists
router.get("/specialists", adminController.getSpecialists);

// Route to approve a specialist
router.post("/specialists/:id/approve", adminController.approveSpecialist);

// Route to reject a specialist
router.post("/specialists/:id/reject", adminController.rejectSpecialist);

module.exports = router;
