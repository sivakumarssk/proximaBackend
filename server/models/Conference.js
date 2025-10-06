const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conference", conferenceSchema);
