const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed"],
      default: "pending",
    },
    message: String,
    feedback: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

// Method to check for overlapping appointments
appointmentSchema.statics.checkOverlap = async function (
  specialistId,
  startTime,
  endTime
) {
  const overlappingAppointment = await this.findOne({
    specialist: specialistId,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
    ],
  });
  return !!overlappingAppointment;
};

module.exports = mongoose.model("Appointment", appointmentSchema);
