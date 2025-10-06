// models/UpcomingPage.js
const mongoose = require('mongoose');

const HeroSchema = new mongoose.Schema({
  title:    { type: String, default: 'Upcoming Events' },
  subtitle: { type: String, default: '' },
  bgImage:  { type: String, default: '' }, // '/uploads/upcoming/...'
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  startDate: { type: String, default: '' }, // store as 'YYYY-MM-DD' or ISO
  endDate:   { type: String, default: '' },
  country:   { type: String, default: '' },
  city:      { type: String, default: '' },
  image:     { type: String, default: '' }, // '/uploads/upcoming/...'
  website:   { type: String, default: '' },
}, { _id: false });

const UpcomingPageSchema = new mongoose.Schema({
  hero:   { type: HeroSchema, default: () => ({}) },
  events: { type: [EventSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('UpcomingEvents', UpcomingPageSchema);
