// controllers/contactController.js
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject = '', message = '' } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });

    const doc = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/contact?q=&status=&from=&to=&page=1&limit=20
exports.listContacts = async (req, res) => {
  try {
    const {
      q = '', status = '', from = '', to = '',
      page = 1, limit = 20
    } = req.query || {};

    const filter = {};
    if (status && ['new','read','archived'].includes(status)) filter.status = status;
    if (q) {
      filter.$or = [
        { name:    { $regex: q, $options: 'i' } },
        { email:   { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
      ];
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const pg   = Math.max(parseInt(page, 10) || 1, 1);
    const lim  = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const skip = (pg - 1) * lim;

    const [items, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      ContactMessage.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: items,
      page: pg,
      limit: lim,
      total,
      pages: Math.ceil(total / lim)
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/contact/:id
exports.getContact = async (req, res) => {
  try {
    const doc = await ContactMessage.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/contact/:id  (e.g. { status: 'read', note: '...'})
exports.updateContact = async (req, res) => {
  try {
    const { status, note } = req.body || {};
    const update = {};
    if (status && ['new','read','archived'].includes(status)) update.status = status;
    if (typeof note === 'string') update.note = note;

    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/contact/:id
exports.deleteContact = async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};
