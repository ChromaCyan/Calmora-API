const Mood = require('../model/moodModel');
const Patient = require('../model/patientModel');  
const User = require("../model/userModel");

// Create mood entry
exports.createMood = async (req, res) => {
  try {
    const { moodScale, moodDescription } = req.body;
    const patientId = req.user.id; 

    const existingMood = await Mood.findOne({
      patient: patientId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) }
    });

    if (existingMood) {
      return res.status(400).json({ message: 'You can only add one mood entry per day.' });
    }

    const newMood = new Mood({
      moodScale,
      moodDescription,
      patient: patientId,
    });

    await newMood.save();
    res.status(201).json({ message: 'Mood entry created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all mood entries for a specific patient
exports.getMoods = async (req, res) => {
  try {
    const patientId = req.user.id; 
    const moods = await Mood.find({ patient: patientId }).sort({ createdAt: -1 });

    res.status(200).json(moods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};
