// models/ServicePage.js
const mongoose = require('mongoose');

const HeroSchema = new mongoose.Schema({
  title:    { type: String, default: 'Our Services' },
  subtitle: { type: String, default: '' },
  bgImage:  { type: String, default: '' }, // '/uploads/services/..'
}, { _id: false });

const ServiceItemSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  points:      { type: [String], default: [] },
  image:       { type: String, default: '' }, // '/uploads/services/..'
}, { _id: false });

const ServicePageSchema = new mongoose.Schema({
  hero:     { type: HeroSchema, default: () => ({}) },
  services: { type: [ServiceItemSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('ServicePage', ServicePageSchema);
