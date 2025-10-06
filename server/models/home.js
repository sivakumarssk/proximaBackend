// models/Home.js
const mongoose = require('mongoose');

const ImgSchema = new mongoose.Schema(
  { src: { type: String, required: true }, alt: { type: String, default: '' } },
  { _id: false }
);

const HeroSchema = new mongoose.Schema(
  {
    images: { type: [ImgSchema], default: [] },
    heading: { type: String, default: 'THE PROXIMA' },
    subheading: { type: String, default: '' },
    buttonText: { type: String, default: 'Explore Conferences' }
  },
  { _id: false }
);

const WelcomeCardSchema = new mongoose.Schema(
  {
    image: { type: String, default: '' }, // <— replaced icon
    title: { type: String, required: true },
    desc: { type: String, required: true },
  },
  { _id: false }
);

const WelcomeSchema = new mongoose.Schema(
  {
    heading: { type: String, default: 'Welcome to Proxima' },
    content: { type: String, default: '' },
    cards: { type: [WelcomeCardSchema], default: [] },
  },
  { _id: false }
);

const StatSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    suffix: { type: String, default: '' },
  },
  { _id: false }
);

const AboutBlockSchema = new mongoose.Schema(
  {
    image: { type: String, default: '' }, // <— replaced icon
    heading: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const ConferenceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    img: { type: String, default: '' },
    text: { type: String, required: true },
    link: { type: String, default: '' },
  },
  { _id: false }
);

const SustainableSchema = new mongoose.Schema(
  {
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: 'Sustainable Conferences' },
  },
  { _id: false }
);

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    affiliation: { type: String, default: '' },
    comment: { type: String, required: true },
    photo: { type: String, default: '' },
  },
  { _id: false }
);

const HomeSchema = new mongoose.Schema(
  {
    hero: { type: HeroSchema, default: () => ({}) },
    welcome: { type: WelcomeSchema, default: () => ({}) },
    stats: { type: [StatSchema], default: [] },
    about: { type: [AboutBlockSchema], default: [] },
    conferences: { type: [ConferenceSchema], default: [] },
    sustainableConferences: { type: SustainableSchema, default: () => ({}) },
    testimonials: { type: [TestimonialSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Home', HomeSchema);
