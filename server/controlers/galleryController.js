// controllers/galleryController.js
const GalleryPage = require('../models/GalleryPage');
const { uploadFile, deleteFile } = require('../middlewares/filehandle');

// parse JSON from multipart or plain
const parse = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

const normalizeBody = (body = {}) => ({
  hero: parse(body.hero),
  years: parse(body.years),
});

// sanitize incoming body → keep only allowed fields
const sanitizeYears = (arr, prev = []) => {
  if (!Array.isArray(arr)) return prev;
  return arr.map((y) => ({
    year: Number(y?.year) || new Date().getFullYear(),
    events: Array.isArray(y?.events) ? y.events.map((e) => ({
      title: e?.title || '',
      images: Array.isArray(e?.images) ? e.images.filter(Boolean) : [],
    })) : [],
  }));
};

// collect image paths from a doc
const collectImagePaths = (doc) => {
  const paths = [];
  if (doc?.hero?.bgImage) paths.push(doc.hero.bgImage);
  (doc?.years || []).forEach((y) => {
    (y.events || []).forEach((e) => {
      (e.images || []).forEach((p) => paths.push(p));
    });
  });
  return paths;
};

const applyPlain = (doc, body) => {
  if (body.hero) {
    doc.hero.title    = body.hero.title ?? doc.hero.title;
    doc.hero.subtitle = body.hero.subtitle ?? doc.hero.subtitle;
    // hero.bgImage is handled by files
  }
  if (Array.isArray(body.years)) {
    doc.years = sanitizeYears(body.years, doc.years);
  }
};

// files:
// - heroBg (single)
// - eventImgs{yIdx}_{eIdx} (single or multiple)
const applyFiles = async (doc, req) => {
  const files = req.files || {};

  // hero
  if (files.heroBg) {
    const prev = doc.hero?.bgImage;
    if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
    const saved = await uploadFile(files.heroBg, 'gallery');
    if (saved) doc.hero.bgImage = saved;
  }

  // events
  if (!Array.isArray(doc.years)) return;
  for (let yi = 0; yi < doc.years.length; yi++) {
    const yearBlock = doc.years[yi];
    if (!Array.isArray(yearBlock.events)) continue;
    for (let ei = 0; ei < yearBlock.events.length; ei++) {
      const key = `eventImgs${yi}_${ei}`;
      if (files[key]) {
        const f = files[key];
        const addOne = async (file) => {
          const saved = await uploadFile(file, 'gallery');
          if (saved) yearBlock.events[ei].images.push(saved);
        };
        if (Array.isArray(f)) {
          for (const one of f) await addOne(one);
        } else {
          await addOne(f);
        }
      }
    }
  }
};

/** GET /api/gallery (get or auto-create) */
exports.getGallery = async (_req, res) => {
  try {
    let g = await GalleryPage.findOne();
    if (!g) g = await GalleryPage.create({});
    res.json(g);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/** POST /api/gallery */
exports.createGallery = async (req, res) => {
  try {
    const body = normalizeBody(req.body);
    const g = new GalleryPage();
    applyPlain(g, body);
    await applyFiles(g, req);
    await g.save();
    res.status(201).json(g);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /api/gallery/:id */
// PATCH /api/gallery/:id
exports.updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const g = await GalleryPage.findById(id);
    if (!g) return res.status(404).json({ message: 'Gallery doc not found' });

    // capture current paths first
    const beforePaths = new Set(collectImagePaths(g).filter(Boolean));

    // 1) apply json fields
    const body = normalizeBody(req.body);
    applyPlain(g, body);

    // 2) append newly uploaded files (eventImgs{yIdx}_{eIdx}, heroBg)
    await applyFiles(g, req);

    // 3) ensure mongoose registers deep changes
    g.markModified('years');

    // 4) compute removed paths (present before, not present now)
    const afterPaths = new Set(collectImagePaths(g).filter(Boolean));
    for (const p of beforePaths) {
      if (!afterPaths.has(p) && p.startsWith('/uploads/')) {
        try { await deleteFile(p); } catch {}
      }
    }

    // 5) save
    await g.save();
    return res.json(g);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};


/** DELETE /api/gallery/:id */
exports.deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const g = await GalleryPage.findById(id);
    if (!g) return res.status(404).json({ message: 'Gallery doc not found' });

    const paths = collectImagePaths(g).filter((p) => p && p.startsWith('/uploads/'));
    for (const p of paths) { try { await deleteFile(p); } catch {} }

    await GalleryPage.findByIdAndDelete(id);
    res.json({ message: 'Gallery deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
