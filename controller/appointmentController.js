const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, specialistId, startTime, message } = req.body;

    // Validate that the specialist exists
    const specialist = await User.findById(specialistId);
    if (!specialist || specialist.userType !== "Specialist") {
      return res.status(404).json({ error: "Specialist not found" });
    }

    // Calculate endTime (1 hour after startTime)
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Check for overlapping appointments
    const isOverlap = await Appointment.checkOverlap(specialistId, startTime, endTime);
    if (isOverlap) {
      return res.status(400).json({ error: "This time slot is already booked" });
    }

    // Create the appointment
    const appointment = await Appointment.create({
      patient: patientId,
      specialist: specialistId,
      startTime,
      endTime,
      message,
    });

    res.status(201).json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all appointments for a patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patient: patientId })
      .populate("specialist", "firstName lastName specialization")
      .sort({ startTime: 1 });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all appointments for a specialist
exports.getSpecialistAppointments = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const appointments = await Appointment.find({ specialist: specialistId })
      .populate("patient", "firstName lastName")
      .sort({ startTime: 1 }); 
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Specialist accepts an appointment
exports.acceptAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "accepted" },
      { new: true }
    );
    res.status(200).json({ message: "Appointment accepted", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Specialist declines an appointment
exports.declineAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "declined" },
      { new: true }
    );
    res.status(200).json({ message: "Appointment declined", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};