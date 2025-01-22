const mongoose = require('mongoose');
const User = require('./userModel');

const specialistSchema = new mongoose.Schema({
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  bio: { type: String, default: 'No bio available.' },
  yearsOfExperience: { type: Number, default: 0 },  
  languagesSpoken: { type: [String], default: [] },  
  availability: { type: String, default: 'Available' }, 
  reviews: [{
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    reviewerName: { type: String }
  }],
}, { timestamps: true });

module.exports = User.discriminator('Specialist', specialistSchema);
