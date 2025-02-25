const mongoose = require('mongoose');
const User = require('./userModel');

const specialistSchema = new mongoose.Schema({
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  bio: { type: String, default: 'No bio available.' },
  yearsOfExperience: { type: Number, default: 0 },  
  languagesSpoken: { type: [String], default: [] },  
  availability: { type: String, default: 'Available' }, 
  location: { type: String, default: 'Dagupan City'},
  clinic: { type: String, default: null },
  workingHours: {
    start: { type: String, default: null },
    end: { type: String, default: null },
  } ,
  //status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, 
}, { timestamps: true });

module.exports = User.discriminator('Specialist', specialistSchema);
