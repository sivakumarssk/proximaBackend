// models/About.js
const mongoose = require('mongoose');

const HeroSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'About Proxima' },
    subtitle: { type: String, default: '' },
    bgImage: { type: String, default: '' }, // stored path '/uploads/about/..'
  },
  { _id: false }
);

const ContentSectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // stored path
  },
  { _id: false }
);

const CounterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    number: { type: String, required: true }, // "124+" etc.
  },
  { _id: false }
);

const ApproachSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    color: { type: String, default: 'border-blue-500' }, // tailwind class
    colorHex: { type: String, default: '' }, // tailwind class
  },
  { _id: false }
);

const AboutSchema = new mongoose.Schema(
  {
    hero: { type: HeroSchema, default: () => ({}) },
    contentSections: { type: [ContentSectionSchema], default: [] },
    counters: { type: [CounterSchema], default: [] },
    approach: { type: [ApproachSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('About', AboutSchema);
