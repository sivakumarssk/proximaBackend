// models/Subscriber.js
const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
  status:    { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
  source:    { type: String, default: 'site' }, // where it came from (optional)
  ip:        { type: String, default: '' },
  userAgent: { type: String, default: '' },
  note:      { type: String, default: '' }, // admin note (optional)
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', SubscriberSchema);
