// models/ContactMessage.js
const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, trim: true },
  subject:  { type: String, default: '', trim: true },
  message:  { type: String, default: '', trim: true },
  status:   { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
  note:     { type: String, default: '' },              // admin note (optional)
  ip:       { type: String, default: '' },
  userAgent:{ type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
