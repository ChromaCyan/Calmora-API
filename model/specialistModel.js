const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const specialistSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    userType: { type: String, default: 'specialist' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

specialistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Specialist', specialistSchema);
