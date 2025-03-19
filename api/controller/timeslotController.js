const TimeSlot = require("../model/timeslotModel");
const { createNotification } = require("./notificationController");
const Appointment = require("../model/appointmentModel2");
const User = require("../model/userModel");

// Get all available time slot for that specialist
exports.getAvailableSlots = async (req, res) => {
  try {
    const { specialistId, date } = req.params;

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const slots = await TimeSlot.find({
      specialist: specialistId,
      dayOfWeek: { $regex: new RegExp(dayOfWeek, "i") },
      isBooked: false,
    });

    // Inside getAvailableSlots
    console.log(`Specialist ID: ${specialistId}, Date: ${date}`);
    console.log(`Day of Week: ${dayOfWeek}`);
    console.log(`Matching Slots: ${slots.length}`);

    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all time slots for a specialist (regardless of date)
exports.getAllSlots = async (req, res) => {
  try {
    const { specialistId } = req.params;

    const slots = await TimeSlot.find({ specialist: specialistId });

    if (!slots.length) {
      return res
        .status(404)
        .json({ success: false, message: "No time slots found" });
    }

    // Inside getAllSlots
    console.log(`Specialist ID: ${specialistId}`);
    console.log(`Found Slots: ${slots.length}`);
    console.log(`Slots:`, slots);

    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a time slot for that specialist.
exports.addTimeSlot = async (req, res) => {
  try {
    const { specialistId, dayOfWeek, startTime, endTime } = req.body;

    const isOverlap = await TimeSlot.exists({
      specialist: specialistId,
      dayOfWeek: dayOfWeek,
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (isOverlap) {
      return res.status(400).json({
        success: false,
        message: "Time slot overlaps with existing slot",
      });
    }

    const isDuplicateDay = await TimeSlot.exists({
      specialist: specialistId,
      dayOfWeek: dayOfWeek,
    });

    if (isDuplicateDay) {
      return res.status(400).json({
        success: false,
        message:
          "Time slot for this day already exists. Please edit the existing slot.",
      });
    }

    const newSlot = await TimeSlot.create({
      specialist: specialistId,
      dayOfWeek,
      startTime,
      endTime,
    });

    res.status(201).json({ success: true, data: newSlot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a time slot for a specialist
exports.updateTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { startTime, endTime, dayOfWeek } = req.body;

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // Check for duplicate day with a different slot
    const isDuplicateDay = await TimeSlot.exists({
      specialist: slot.specialist,
      dayOfWeek: dayOfWeek || slot.dayOfWeek,
      _id: { $ne: slotId }, // Exclude the current slot
    });

    if (isDuplicateDay) {
      return res.status(400).json({
        success: false,
        message: `A time slot for ${
          dayOfWeek || slot.dayOfWeek
        } already exists. Please update the existing slot.`,
      });
    }

    // Check for overlapping time slots on the same day
    const isOverlap = await TimeSlot.exists({
      specialist: slot.specialist,
      dayOfWeek: dayOfWeek || slot.dayOfWeek,
      _id: { $ne: slotId },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (isOverlap) {
      return res.status(400).json({
        success: false,
        message: "Updated time slot overlaps with an existing slot.",
      });
    }

    // Update the slot details
    slot.startTime = startTime || slot.startTime;
    slot.endTime = endTime || slot.endTime;
    slot.dayOfWeek = dayOfWeek || slot.dayOfWeek;

    await slot.save();

    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Book a time slot and create an appointment
exports.bookTimeSlot = async (req, res) => {
  try {
    const { patientId, slotId, message } = req.body;

    // Validate time slot existence
    const slot = await TimeSlot.findById(slotId).populate("specialist");

    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Time slot not found" });
    }

    if (slot.isBooked) {
      return res
        .status(400)
        .json({ success: false, message: "Time slot is already booked" });
    }

    // Validate patient existence
    const patient = await User.findById(patientId);
    if (!patient || patient.userType !== "patient") {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Check if patient already has an appointment at the same time (any specialist)
    const existingAppointment = await Appointment.findOne({
      patient: patientId,
      startTime: slot.startTime,
      status: { $nin: ["completed", "declined"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    // Create the appointment
    const appointment = await Appointment.create({
      patient: patientId,
      specialist: slot.specialist._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      message,
    });

    // Mark slot as booked
    slot.isBooked = true;
    slot.bookedBy = patientId;
    await slot.save();

    // Send notification to specialist
    await createNotification(
      slot.specialist._id,
      "appointment",
      `You have a new appointment request from ${patient.firstName}`
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
