const mongoose = require("mongoose");

const surveyResponseSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    responses: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        choiceId: { type: mongoose.Schema.Types.ObjectId, required: true },
        score: { type: Number, required: true, min: 1, max: 4 },
      },
    ],
    totalScore: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["emotional_wellbeing", "stress_levels", "social_support", "physical_wellness"],
    },
    interpretation: { type: String, required: true }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("SurveyResponse", surveyResponseSchema);
