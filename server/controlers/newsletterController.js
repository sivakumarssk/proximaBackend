// controllers/newsletterController.js
const Subscriber = require('../models/Subscriber');

const isEmail = (s='') => /^\S+@\S+\.\S+$/.test(s);

// POST /api/newsletter/subscribe
exports.subscribe = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ message: 'Valid email required' });

    // upsert: if exists -> set status subscribed
    const doc = await Subscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          status: 'subscribed',
          source: 'site',
          ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
          userAgent: req.headers['user-agent'] || ''
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    // handle unique index race
    if (e.code === 11000) return res.status(200).json({ success: true, message: 'Already subscribed' });
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/newsletter?q=&status=&from=&to=&page=1&limit=20
exports.list = async (req, res) => {
  try {
    const { q = '', status = '', from = '', to = '', page = 1, limit = 20 } = req.query || {};

    const filter = {};
    if (q) filter.email = { $regex: q, $options: 'i' };
    if (status && ['subscribed','unsubscribed'].includes(status)) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 500);
    const skip = (pg - 1) * lim;

    const [data, total] = await Promise.all([
      Subscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Subscriber.countDocuments(filter)
    ]);

    return res.json({ success: true, data, page: pg, limit: lim, total, pages: Math.ceil(total / lim) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/newsletter/:id  (e.g. { status: 'unsubscribed', note: 'bounced' })
exports.update = async (req, res) => {
  try {
    const { status, note } = req.body || {};
    const update = {};
    if (status && ['subscribed','unsubscribed'].includes(status)) update.status = status;
    if (typeof note === 'string') update.note = note;

    const doc = await Subscriber.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/newsletter/:id
exports.remove = async (req, res) => {
  try {
    const doc = await Subscriber.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};
