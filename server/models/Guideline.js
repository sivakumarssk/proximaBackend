const mongoose = require("mongoose");

const guidelineSchema = new mongoose.Schema(
  {
    speaker: { type: String, required: true }, // rich text (HTML)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guideline", guidelineSchema);