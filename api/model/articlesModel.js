const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    heroImage: { type: String, required: true },
    additionalImages: [{ type: String }],
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
      required: true,
    },
    publishedDate: { type: Date, default: Date.now },
    categories: {
      type: [String],
      enum: [
        "health",
        "social",
        "relationships",
        "growth",
        "coping strategies",
        "mental wellness",
        "self-care",
      ],
      required: true,
    },
    targetGender: {
      type: String,
      enum: ["male", "female", "everyone"],
      default: "everyone",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "unpublished"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
