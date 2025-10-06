// controllers/upcomingController.js
const UpcomingPage = require('../models/UpcomingEvents');
const { uploadFile, deleteFile } = require('../middlewares/filehandle');

// helpers
const parse = (v) => { if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } } return v; };
const normalizeBody = (body = {}) => ({ hero: parse(body.hero), events: parse(body.events) });

const sanitizeEvents = (arr, prev = []) => {
  if (!Array.isArray(arr)) return prev;
  return arr.map((e, i) => ({
    title:     e?.title ?? prev[i]?.title ?? '',
    startDate: e?.startDate ?? prev[i]?.startDate ?? '',
    endDate:   e?.endDate ?? prev[i]?.endDate ?? '',
    country:   e?.country ?? prev[i]?.country ?? '',
    city:      e?.city ?? prev[i]?.city ?? '',
    image:     e?.image ?? prev[i]?.image ?? '',
    website:   e?.website ?? prev[i]?.website ?? '',
  }));
};

const collectPaths = (doc) => {
  const out = [];
  if (doc?.hero?.bgImage) out.push(doc.hero.bgImage);
  (doc?.events || []).forEach(ev => { if (ev?.image) out.push(ev.image); });
  return out;
};

const applyPlain = (doc, body) => {
  if (body.hero) {
    doc.hero.title    = body.hero.title ?? doc.hero.title;
    doc.hero.subtitle = body.hero.subtitle ?? doc.hero.subtitle;
    // hero bgImage via files
  }
  if (Array.isArray(body.events)) doc.events = sanitizeEvents(body.events, doc.events);
};

const applyFiles = async (doc, req) => {
  const files = req.files || {};
  if (files.heroBg) {
    const prev = doc.hero?.bgImage;
    if (prev && prev.startsWith('/uploads/')) { try { await deleteFile(prev); } catch {} }
    const saved = await uploadFile(files.heroBg, 'upcoming');
    if (saved) doc.hero.bgImage = saved;
  }
  // eventImg{index}
  if (Array.isArray(doc.events)) {
    for (let i = 0; i < doc.events.length; i++) {
      const key = `eventImg${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.events[i].image;
        if (prev && prev.startsWith('/uploads/')) { try { await deleteFile(prev); } catch {} }
        const saved = await uploadFile(f, 'upcoming');
        if (saved) doc.events[i].image = saved;
      }
    }
  }
};

// GET /api/upcoming (latest or auto-create)
exports.getUpcoming = async (_req, res) => {
  try {
    let doc = await UpcomingPage.findOne().sort({ updatedAt: -1 });
    if (!doc) doc = await UpcomingPage.create({});
    return res.json(doc);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error' }); }
};

// POST /api/upcoming (upsert singleton)
exports.createUpcoming = async (req, res) => {
  try {
    let doc = await UpcomingPage.findOne().sort({ updatedAt: -1 });
    if (!doc) doc = new UpcomingPage();
    const body = normalizeBody(req.body);
    applyPlain(doc, body);
    await applyFiles(doc, req);
    doc.markModified('events');
    await doc.save();
    return res.status(201).json(doc);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error' }); }
};

// PATCH /api/upcoming/:id
exports.updateUpcoming = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await UpcomingPage.findById(id);
    if (!doc) return res.status(404).json({ message: 'Upcoming doc not found' });

    const before = new Set(collectPaths(doc).filter(Boolean));

    const body = normalizeBody(req.body);
    applyPlain(doc, body);
    await applyFiles(doc, req);

    doc.markModified('events');

    const after = new Set(collectPaths(doc).filter(Boolean));
    for (const p of before) {
      if (!after.has(p) && p.startsWith('/uploads/')) {
        try { await deleteFile(p); } catch {}
      }
    }

    await doc.save();
    return res.json(doc);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error' }); }
};

// DELETE /api/upcoming/:id
exports.deleteUpcoming = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await UpcomingPage.findById(id);
    if (!doc) return res.status(404).json({ message: 'Upcoming doc not found' });

    const paths = collectPaths(doc).filter(p => p && p.startsWith('/uploads/'));
    for (const p of paths) { try { await deleteFile(p); } catch {} }

    await UpcomingPage.findByIdAndDelete(id);
    return res.json({ message: 'Upcoming deleted' });
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Server error' }); }
};
