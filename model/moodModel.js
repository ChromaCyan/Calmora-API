const mongoose = require('mongoose');
const { Schema } = mongoose;

const moodSchema = new Schema({
  moodScale: { type: Number, required: true, min: 1, max: 4 },
  moodDescription: { type: String, required: true, minlength: 2 },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Mood', moodSchema);
