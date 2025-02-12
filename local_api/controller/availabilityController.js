const Availability = require("../model/availabilityModel");
const express = require("express");

// Get available days and time slots for a specialist
exports.getAvailableDaysAndSlots = async (req, res) => {
    try {
      const { specialistId } = req.params;
      const availability = await Availability.findOne({ specialist: specialistId });
  
      if (!availability) {
        return res.status(404).json({ error: "Specialist's availability not found" });
      }
  
      const availableDays = availability.timeSlots.map(slot => slot.day);
  
      // Define blocked days if needed
      const blockedDays = ['Sunday', 'Monday'];
  
      // Filter out blocked days
      const availableDaysForCalendar = availableDays.filter(day => !blockedDays.includes(day));
  
      res.status(200).json({ availableDays: availableDaysForCalendar, timeSlots: availability.timeSlots });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Create or update availability for a specialist
  exports.setAvailableDaysAndSlots = async (req, res) => { 
    const { specialistId } = req.params;
    const { timeSlots } = req.body; 
  
    try {
      let availability = await Availability.findOne({ specialist: specialistId });
  
      if (availability) {
        availability.timeSlots = timeSlots;
      } else {
        availability = new Availability({
          specialist: specialistId,
          timeSlots,
        });
      }
  
      await availability.save();
      res.status(200).json({ message: "Availability saved successfully", availability });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  