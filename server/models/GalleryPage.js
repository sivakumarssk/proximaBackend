// models/GalleryPage.js
const mongoose = require('mongoose');

const HeroSchema = new mongoose.Schema({
  title:    { type: String, default: 'Our Gallery' },
  subtitle: { type: String, default: '' },
  bgImage:  { type: String, default: '' }, // '/uploads/gallery/..'
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title:  { type: String, required: true },
  images: { type: [String], default: [] }, // '/uploads/gallery/..'
}, { _id: false });

const YearBlockSchema = new mongoose.Schema({
  year:   { type: Number, required: true },
  events: { type: [EventSchema], default: [] },
}, { _id: false });

const GalleryPageSchema = new mongoose.Schema({
  hero:  { type: HeroSchema, default: () => ({}) },
  years: { type: [YearBlockSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('GalleryPage', GalleryPageSchema);
