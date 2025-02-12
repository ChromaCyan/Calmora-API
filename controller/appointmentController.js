const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const { io } = require("../socket/socket");
const { createNotification } = require("./notificationController");
const Availability = require("../model/availabilityModel");


// // Create a new appointment
// exports.createAppointment = async (req, res) => {
//   try {
//     const { patientId, specialistId, startTime, message } = req.body;

//     // Validate that the specialist exists
//     const specialist = await User.findById(specialistId);
//     if (!specialist || specialist.userType !== "Specialist") {
//       return res.status(404).json({ error: "Specialist not found" });
//     }

//     // Check if the patient already has an appointment with this specialist
//     const existingAppointment = await Appointment.findOne({
//       patient: patientId,
//       specialist: specialistId,
//       status: { $nin: ["completed", "declined"] }, 
//     });

//     if (existingAppointment) {
//       return res.status(400).json({ error: "You already have an active appointment with this specialist" });
//     }

//     // Get specialist's availability
//     const availability = await Availability.findOne({ specialist: specialistId });
//     if (!availability) {
//       return res.status(404).json({ error: "Specialist's availability not set" });
//     }

//     // Check if the selected start time is available (compare against time slots)
//     const startDate = new Date(startTime);
//     const dayOfWeek = startDate.toLocaleString('en-us', { weekday: 'long' });

//     const isAvailable = availability.timeSlots.some(slot => {
//       return (
//         slot.day === dayOfWeek &&
//         startDate >= new Date(`${startDate.toDateString()} ${slot.startTime}`) &&
//         startDate <= new Date(`${startDate.toDateString()} ${slot.endTime}`)
//       );
//     });

//     if (!isAvailable) {
//       return res.status(400).json({ error: "The selected time slot is unavailable" });
//     }

//     // Calculate endTime (1 hour after startTime)
//     const endTime = new Date(startTime);
//     endTime.setHours(endTime.getHours() + 1);

//     // Check for overlapping appointments (same specialist and same time range)
//     const isOverlap = await Appointment.checkOverlap(specialistId, startTime, endTime);
//     if (isOverlap) {
//       return res.status(400).json({ error: "This time slot is already booked" });
//     }

//     // Create the appointment
//     const appointment = await Appointment.create({
//       patient: patientId,
//       specialist: specialistId,
//       startTime,
//       endTime,
//       message,
//     });

//     // Notification for specialist about the new appointment
//     await createNotification(specialistId, "appointment", "You have a new appointment request.");

//     res.status(201).json({ message: "Appointment created successfully", appointment });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, specialistId, startTime, message } = req.body;

    // Validate that the specialist exists
    const specialist = await User.findById(specialistId);
    if (!specialist || specialist.userType !== "Specialist") {
      return res.status(404).json({ error: "Specialist not found" });
    }

    // Check if the patient already has an appointment with this specialist
    const existingAppointment = await Appointment.findOne({
      patient: patientId,
      specialist: specialistId,
      status: { $nin: ["completed", "declined"] }, 
    });

    if (existingAppointment) {
      return res.status(400).json({ error: "You already have an active appointment with this specialist" });
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

    // Notification for specialist about the new appointment
    await createNotification(specialistId, "appointment", "You have a new appointment request.");

    // io.to(specialistId).emit("new_notification", {
    //   type: "appointment",
    //   message: `New appointment created by ${patientId}`,
    //   appointmentId: appointment._id,
    //   timestamp: new Date(),
    // });

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
    ).populate("patient specialist", "firstName lastName"); 

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const patient = appointment.patient;
    if (!patient) {
      return res.status(400).json({ error: "Patient data missing in appointment" });
    }

    // Notification for patient
    // await createNotification(patient._id, "appointment", "Your appointment has been accepted.");
    // io.to(patient._id).emit("new_notification", {
    //   type: "appointment",
    //   message: `Your appointment with ${appointment.specialist.firstName} has been accepted.`,
    //   appointmentId: appointment._id,
    //   timestamp: new Date(),
    // });

    await createNotification(patient._id, "appointment", "Your appointment has been accepted.");

    res.status(200).json({ message: "Appointment accepted", appointment });
  } catch (error) {
    console.error("Error accepting appointment:", error); 
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
    ).populate("patient specialist", "firstName lastName"); 

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const patient = appointment.patient;
    if (!patient) {
      return res.status(400).json({ error: "Patient data missing in appointment" });
    }

    // Notification for patient
    await createNotification(patient._id, "appointment", "Your appointment has been rejected.");
    // io.to(patient._id).emit("new_notification", {
    //   type: "appointment",
    //   message: `Your appointment with ${appointment.specialist.firstName} has been declined.`,
    //   appointmentId: appointment._id,
    //   timestamp: new Date(),
    // });

    res.status(200).json({ message: "Appointment declined", appointment });
  } catch (error) {
    console.error("Error declining appointment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Specialist completes an appointment
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { feedback, imageUrl } = req.body; 

    // Validate input
    if (!feedback || !imageUrl) {
      return res.status(400).json({ error: "Feedback and image URL are required to complete the appointment." });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId).populate("patient specialist");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if the appointment is already completed
    if (appointment.status === "completed") {
      return res.status(400).json({ error: "This appointment is already completed." });
    }

    // Update appointment details
    appointment.status = "completed";
    appointment.feedback = feedback;
    appointment.imageUrl = imageUrl; 
    await appointment.save();

    // Notify patient that their appointment is completed
    await createNotification(
      appointment.patient._id,
      "appointment",
      `Your appointment with ${appointment.specialist.firstName} has been marked as completed.`
    );

    res.status(200).json({ message: "Appointment completed successfully", appointment });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCompletedAppointments = async (req, res) => {
  try {
    const { userId } = req.params; 

    const appointments = await Appointment.find({
      $or: [{ patient: userId }, { specialist: userId }],
      status: "completed"
    })
      .populate("specialist", "firstName lastName specialization")
      .populate("patient", "firstName lastName")
      .select("startTime endTime status feedback imageUrl specialist patient") 
      .sort({ startTime: -1 }); 

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching completed appointments:", error);
    res.status(500).json({ error: error.message });
  }
};
