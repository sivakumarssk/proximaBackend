// controllers/serviceController.js
const ServicePage = require('../models/ServicePage');
const { uploadFile, deleteFile } = require('../middlewares/filehandle');

// safe parse for JSON parts coming from multipart
const parse = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

const normalizeBody = (body = {}) => ({
  hero: parse(body.hero),
  services: parse(body.services),
});

const applyPlain = (doc, body) => {
  if (body.hero) {
    doc.hero.title    = body.hero.title    ?? doc.hero.title;
    doc.hero.subtitle = body.hero.subtitle ?? doc.hero.subtitle;
    // hero.bgImage handled via files
  }
  if (Array.isArray(body.services)) {
    // sanitize each service shape
    doc.services = body.services.map(s => ({
      title:       s?.title ?? '',
      description: s?.description ?? '',
      points:      Array.isArray(s?.points) ? s.points.map(p => String(p ?? '')) : [],
      image:       s?.image || '',
    }));
  }
};

const applyFiles = async (doc, req) => {
  const files = req.files || {};

  // hero background
  if (files.heroBg) {
    const prev = doc.hero?.bgImage;
    if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
    const saved = await uploadFile(files.heroBg, 'services');
    if (saved) doc.hero.bgImage = saved;
  }

  // per-service images: serviceImgs0, serviceImgs1, ...
  if (Array.isArray(doc.services)) {
    for (let i = 0; i < doc.services.length; i++) {
      const key = `serviceImgs${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.services[i].image;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'services');
        if (saved) doc.services[i].image = saved;
      }
    }
  }
};

/** GET /api/services (get or auto-create) */
exports.getServices = async (_req, res) => {
  try {
    let sp = await ServicePage.findOne();
    if (!sp) sp = await ServicePage.create({});
    res.json(sp);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/** POST /api/services */
exports.createServices = async (req, res) => {
  try {
    const body = normalizeBody(req.body);
    const sp = new ServicePage();
    applyPlain(sp, body);
    await applyFiles(sp, req);
    await sp.save();
    res.status(201).json(sp);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /api/services/:id */
exports.updateServices = async (req, res) => {
  try {
    const { id } = req.params;
    const sp = await ServicePage.findById(id);
    if (!sp) return res.status(404).json({ message: 'Services doc not found' });

    const body = normalizeBody(req.body);
    applyPlain(sp, body);
    await applyFiles(sp, req);
    await sp.save();

    res.json(sp);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/** DELETE /api/services/:id */
exports.deleteServices = async (req, res) => {
  try {
    const { id } = req.params;
    const sp = await ServicePage.findById(id);
    if (!sp) return res.status(404).json({ message: 'Services doc not found' });

    const paths = [];
    if (sp.hero?.bgImage?.startsWith('/uploads/')) paths.push(sp.hero.bgImage);
    (sp.services || []).forEach(s => { if (s?.image?.startsWith('/uploads/')) paths.push(s.image); });
    for (const p of paths) { try { await deleteFile(p); } catch {} }

    await ServicePage.findByIdAndDelete(id);
    res.json({ message: 'Services deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
