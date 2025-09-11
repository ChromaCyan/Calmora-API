const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");
const { io } = require("../socket/socket");
const { createNotification } = require("./notificationController");
const Availability = require("../model/availabilityModel");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Function to generate time slots
function generateTimeSlots(start, end) {
  const slots = [];
  let [startHour, startMinute] = start.split(":").map(Number);
  let [endHour, endMinute] = end.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current < endTime) {
    let slotStart = `${current.getHours().toString().padStart(2, "0")}:${current
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    current.setMinutes(current.getMinutes() + 60);

    let slotEnd = `${current.getHours().toString().padStart(2, "0")}:${current
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    slots.push({ start: slotStart, end: slotEnd });
  }

  return slots;
}

// Endpoint to get available time slots for a specialist
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { specialistId, date } = req.params;

    // Validate specialist existence
    const specialist = await User.findById(specialistId);
    if (!specialist || specialist.userType !== "Specialist") {
      return res.status(404).json({ error: "Specialist not found" });
    }

    const { start, end } = specialist.workingHours;
    if (!start || !end) {
      return res.status(400).json({ error: "Working hours not set" });
    }

    // Generate available slots
    const allSlots = generateTimeSlots(start, end);

    // Fetch booked appointments for the selected date
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const bookedAppointments = await Appointment.find({
      specialist: specialistId,
      startTime: {
        $gte: selectedDate,
        $lt: new Date(selectedDate.setDate(selectedDate.getDate() + 1)),
      },
    }).select("startTime");

    const bookedTimes = new Set(
      bookedAppointments.map((appointment) =>
        new Date(appointment.startTime).toISOString().substring(11, 16)
      )
    );

    const availableSlots = allSlots.filter(
      (slot) => !bookedTimes.has(slot.start)
    );

    res.status(200).json({ availableSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create an appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, specialistId, startTime, message } = req.body;

    // Validate specialist existence
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
      return res.status(400).json({
        error: "You already have an active appointment with this specialist",
      });
    }

    // Validate working hours
    if (!specialist.workingHours?.start || !specialist.workingHours?.end) {
      return res
        .status(400)
        .json({ error: "Specialist's working hours are not set" });
    }

    // Parse the selected time
    const startTimeObj = new Date(startTime);
    if (isNaN(startTimeObj.getTime())) {
      return res.status(400).json({ error: "Invalid start time format" });
    }

    // Convert selected time to "HH:MM" format
    const requestedTime = startTimeObj.toISOString().substring(11, 16);

    // Generate available slots
    const allSlots = generateTimeSlots(
      specialist.workingHours.start,
      specialist.workingHours.end
    );

    // Ensure selected time is a valid slot
    const isValidSlot = allSlots.some((slot) => slot.start === requestedTime);
    if (!isValidSlot) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    // Check if the selected time is already booked
    const isBooked = await Appointment.exists({
      specialist: specialistId,
      startTime: startTimeObj, // Must match exact slot
    });

    if (isBooked) {
      return res.status(400).json({ error: "Time slot already booked" });
    }

    // Send notification to specialist
    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: specialist._id,
      type: "appointment",
      message: "You have a new appointment request.",
      extra: { appointmentId: appointment._id, patientId }, 
    });

    res
      .status(201)
      .json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all appointments for a patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patient: patientId })
      .populate("specialist", "firstName lastName specialization profileImage")
      .populate("timeSlot", "startTime endTime dayOfWeek")
      .sort({ appointmentDate: 1 });

    // Ensure startTime and endTime are returned as strings
    appointments.forEach((appointment) => {
      if (appointment.timeSlot) {
        // These are already strings in MongoDB, but ensure they are passed as such
        const { startTime, endTime } = appointment.timeSlot;
        appointment.timeSlot.startTime = startTime || "Invalid Time";
        appointment.timeSlot.endTime = endTime || "Invalid Time";
      }
    });

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
      .populate("patient", "firstName lastName profileImage")
      .populate("timeSlot", "startTime endTime dayOfWeek")
      .sort({ appointmentDate: 1 });

    // Ensure startTime and endTime are returned as strings
    appointments.forEach((appointment) => {
      if (appointment.timeSlot) {
        const { startTime, endTime } = appointment.timeSlot;
        appointment.timeSlot.startTime = startTime || "Invalid Time";
        appointment.timeSlot.endTime = endTime || "Invalid Time";
      }

      // Ensure patient data is returned as strings (if necessary)
      if (appointment.patient) {
        const { firstName, lastName, profileImage } = appointment.patient;
        appointment.patient = {
          firstName: firstName || "Unknown",
          lastName: lastName || "Unknown",
          profileImage: profileImage || "No Image Available",
        };
      }
    });

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
      return res
        .status(400)
        .json({ error: "Patient data missing in appointment" });
    }

    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: patient._id,
      type: "appointment",
      message: "Your appointment has been accepted.",
      extra: {
        appointmentId: appointment._id,
        specialistId: appointment.specialist._id,
      },
    });

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
      return res
        .status(400)
        .json({ error: "Patient data missing in appointment" });
    }

    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: patient._id,
      type: "appointment",
      message: `Your appointment with ${appointment.specialist.firstName} has been declined.`,
      extra: {
        appointmentId: appointment._id,
        specialistId: appointment.specialist._id,
      },
    });

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
      return res.status(400).json({
        error:
          "Feedback and image URL are required to complete the appointment.",
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId).populate(
      "patient specialist"
    );

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if the appointment is already completed
    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ error: "This appointment is already completed." });
    }

    // Update appointment details
    appointment.status = "completed";
    appointment.feedback = feedback;
    appointment.imageUrl = imageUrl;
    await appointment.save();

    // Notify patient that their appointment is completed
    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: appointment.patient._id,
      type: "appointment",
      message: `Your appointment with ${appointment.specialist.firstName} has been marked as completed.`,
      extra: {
        appointmentId: appointment._id,
        specialistId: appointment.specialist._id,
      },
    });

    res
      .status(200)
      .json({ message: "Appointment completed successfully", appointment });
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
      status: "completed",
    })
      .populate("specialist", "firstName lastName specialization profileImage")
      .populate("patient", "firstName lastName profileImage")
      .populate("timeSlot", "startTime endTime dayOfWeek")
      .sort({ startTime: -1 });

    // Ensure startTime and endTime are returned as strings
    appointments.forEach((appointment) => {
      if (appointment.timeSlot) {
        const { startTime, endTime } = appointment.timeSlot;
        appointment.timeSlot.startTime = startTime || "Invalid Time";
        appointment.timeSlot.endTime = endTime || "Invalid Time";
      }

      // Ensure specialist data is returned as strings (if necessary)
      if (appointment.specialist) {
        const { firstName, lastName, profileImage } = appointment.specialist;
        appointment.specialist = {
          firstName: firstName || "Unknown",
          lastName: lastName || "Unknown",
          profileImage: profileImage || "No Image Available",
        };
      }

      // Ensure patient data is returned as strings (if necessary)
      if (appointment.patient) {
        const { firstName, lastName, profileImage } = appointment.patient;
        appointment.patient = {
          firstName: firstName || "Unknown",
          lastName: lastName || "Unknown",
          profileImage: profileImage || "No Image Available",
        };
      }
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching completed appointments:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get completed appointments grouped by day for a specialist
exports.getWeeklyCompletedAppointments = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const { startDate, endDate } = req.query;

    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
      return new Date(d.setDate(diff));
    };

    const start = startDate
      ? getStartOfWeek(new Date(startDate))
      : getStartOfWeek(new Date());
    const end = endDate
      ? getStartOfWeek(new Date(endDate)).setDate(
          getStartOfWeek(new Date(endDate)).getDate() + 6
        )
      : getStartOfWeek(new Date()).setDate(
          getStartOfWeek(new Date()).getDate() + 6
        );

    const appointments = await Appointment.find({
      specialist: specialistId,
      status: "completed",
      appointmentDate: { $gte: start, $lte: end },
    });

    // Group data by day
    const dailyData = {};
    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate)
        .toISOString()
        .split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date]++;
    });

    // Generate all 7 days of the week to ensure completeness
    const generateDays = (start, end) => {
      const days = [];
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        days.push({
          date: dateStr,
          day: current.toLocaleString("en-US", { weekday: "short" }), // Short day name
          count: dailyData[dateStr] || 0,
        });
        current.setDate(current.getDate() + 1);
      }
      return days;
    };

    const formattedData = generateDays(start, new Date(end));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching daily completed appointments:", error);
    res.status(500).json({ error: error.message });
  }
};
