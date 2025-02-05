const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true, 
    enum: ['mental_health'] 
  },
  questions: [{
    questionText: { type: String, required: true },
    choices: [{
      text: { type: String, required: true },
      score: { type: Number, required: true, min: 1, max: 5 }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);
