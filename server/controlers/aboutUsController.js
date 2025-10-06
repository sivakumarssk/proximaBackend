// controllers/aboutController.js
const About = require('../models/aboutUs');
const { uploadFile, deleteFile } = require('../middlewares/filehandle');

// parse JSON-ish strings from multipart
const parse = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch (e) { return v; }
  }
  return v;
};

const normalizeBody = (body = {}) => ({
  hero: parse(body.hero),
  contentSections: parse(body.contentSections),
  counters: parse(body.counters),
  approach: parse(body.approach),
});

const applyPlain = (doc, body) => {
  if (body.hero) {
    doc.hero.title = body.hero.title ?? doc.hero.title;
    doc.hero.subtitle = body.hero.subtitle ?? doc.hero.subtitle;
    // bgImage handled in files
  }
  if (Array.isArray(body.contentSections)) doc.contentSections = body.contentSections;
  if (Array.isArray(body.counters)) doc.counters = body.counters;
  if (Array.isArray(body.approach)) doc.approach = body.approach;
};

const applyFiles = async (doc, req) => {
  const files = req.files || {};

  // hero bg
  if (files.heroBg) {
    const prev = doc.hero?.bgImage;
    if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
    const saved = await uploadFile(files.heroBg, 'about');
    if (saved) doc.hero.bgImage = saved;
  }

  // content section images: sectionImgs0, sectionImgs1, ...
  if (Array.isArray(doc.contentSections)) {
    for (let i = 0; i < doc.contentSections.length; i++) {
      const key = `sectionImgs${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.contentSections[i].image;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'about');
        if (saved) doc.contentSections[i].image = saved;
      }
    }
  }
};

/** GET /api/aboutus (get or auto-create default) */
exports.getAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) about = await About.create({});
    return res.json(about);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** POST /api/aboutus (create) */
exports.createAbout = async (req, res) => {
  try {
    const body = normalizeBody(req.body);
    const about = new About();
    applyPlain(about, body);
    await applyFiles(about, req);
    await about.save();
    return res.status(201).json(about);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /api/aboutus/:id (update) */
exports.updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const about = await About.findById(id);
    if (!about) return res.status(404).json({ message: 'About not found' });

    const body = normalizeBody(req.body);
    applyPlain(about, body);
    await applyFiles(about, req);
    await about.save();

    return res.json(about);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** DELETE /api/aboutus/:id (delete + local files) */
exports.deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const about = await About.findById(id);
    if (!about) return res.status(404).json({ message: 'About not found' });

    const paths = [];
    if (about.hero?.bgImage?.startsWith('/uploads/')) paths.push(about.hero.bgImage);
    (about.contentSections || []).forEach(s => {
      if (s?.image?.startsWith('/uploads/')) paths.push(s.image);
    });
    for (const p of paths) {
      try { await deleteFile(p); } catch {}
    }

    await About.findByIdAndDelete(id);
    return res.json({ message: 'About deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};
