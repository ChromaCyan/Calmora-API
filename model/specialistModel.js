const mongoose = require('mongoose');
const User = require('./userModel');

const specialistSchema = new mongoose.Schema({
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true },
});

module.exports = User.discriminator('Specialist', specialistSchema);
