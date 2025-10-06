const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    title: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    organization: String,
    phone: String,
    city: String,
    country: { type: String, required: true },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conference",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sponsor", sponsorSchema);