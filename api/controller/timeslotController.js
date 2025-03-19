const TimeSlot = require("../model/timeslotModel");
const { createNotification } = require("./notificationController");
const Appointment = require("../model/appointmentModel");
const User = require("../model/userModel");

// Get all available time slots for that specialist on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { specialistId, date } = req.params;

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    // ✅ Get all time slots for that specialist on the selected day
    const slots = await TimeSlot.find({
      specialist: specialistId,
      dayOfWeek: { $regex: new RegExp(dayOfWeek, "i") },
    });

    // ✅ Get appointments already booked for that date
    const appointmentsOnDate = await Appointment.find({
      specialist: specialistId,
      timeSlot: { $in: slots.map((s) => s._id) },
      appointmentDate: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
      status: { $nin: ["completed", "declined"] },
    });

    // ✅ Get IDs of already booked slots for that date
    const bookedSlotIds = appointmentsOnDate.map((a) => a.timeSlot.toString());

    // ✅ Filter out booked slots for that date
    const availableSlots = slots.filter(
      (slot) => !bookedSlotIds.includes(slot._id.toString())
    );

    // 📚 Debugging logs
    console.log(`Specialist ID: ${specialistId}, Date: ${date}`);
    console.log(`Day of Week: ${dayOfWeek}`);
    console.log(`Total Slots Found: ${slots.length}`);
    console.log(`Booked Slots on ${date}: ${bookedSlotIds.length}`);
    console.log(`Available Slots: ${availableSlots.length}`);

    res.status(200).json({ success: true, slots: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error.message);
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

// Book an appointment
exports.bookTimeSlot = async (req, res) => {
  try {
    console.log("Booking Request Body:", req.body);

    const { patientId, slotId, message, appointmentDate } = req.body;

    // Validate time slot existence
    const slot = await TimeSlot.findById(slotId).populate("specialist");

    if (!slot) {
      console.log("Slot not found!");
      return res
        .status(404)
        .json({ success: false, message: "Time slot not found" });
    }

    // Check if this exact slot is already booked for the selected date
    const existingAppointment = await Appointment.findOne({
      timeSlot: slot._id,
      appointmentDate: new Date(appointmentDate),
      status: { $nin: ["completed", "declined"] },
    });

    if (existingAppointment) {
      console.log("Slot already booked for this date!");
      return res.status(400).json({
        success: false,
        message: "Time slot is already booked for this date",
      });
    }

    // Validate patient existence
    const patient = await User.findById(patientId);
    if (!patient || patient.userType !== "Patient") {
      console.log("Patient not found or invalid user type!");
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Create the new appointment with `appointmentDate`
    const newAppointment = await Appointment.create({
      patient: patientId,
      specialist: slot.specialist._id,
      timeSlot: slot._id,
      message,
      appointmentDate: new Date(appointmentDate),
    });

    console.log("Appointment created successfully:", newAppointment);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Booking error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
