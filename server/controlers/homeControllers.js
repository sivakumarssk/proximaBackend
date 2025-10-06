// controllers/homeController.js
const Home = require('../models/Home');
const { uploadFile, deleteFile } = require('../middlewares/filehandle');

/** If arrays/objects come in as JSON strings (multipart), parse them */
const parseBodyArrays = (body) => {
  const keysToParse = [
    'hero', 'welcome', 'welcome.cards', 'stats', 'about',
    'conferences', 'sustainableConferences', 'testimonials'
  ];

  const parsed = { ...body };

  const tryParse = (v) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  };

  // top-level
  parsed.hero = tryParse(parsed.hero);
  parsed.welcome = tryParse(parsed.welcome);
  parsed.stats = tryParse(parsed.stats);
  parsed.about = tryParse(parsed.about);
  parsed.conferences = tryParse(parsed.conferences);
  parsed.sustainableConferences = tryParse(parsed.sustainableConferences);
  parsed.testimonials = tryParse(parsed.testimonials);

  // nested
  if (parsed.welcome && parsed.welcome.cards) {
    parsed.welcome.cards = tryParse(parsed.welcome.cards);
  }

  return parsed;
};

const applyPlainUpdates = (doc, body) => {
  // HERO text
  if (body.hero) {
    doc.hero.heading = body.hero.heading ?? doc.hero.heading;
    doc.hero.subheading = body.hero.subheading ?? doc.hero.subheading;
    doc.hero.buttonText = body.hero.buttonText ?? doc.hero.buttonText;
  }

  // WELCOME text + cards (images for cards handled in file upload step)
  if (body.welcome) {
    doc.welcome.heading = body.welcome.heading ?? doc.welcome.heading;
    doc.welcome.content = body.welcome.content ?? doc.welcome.content;
    if (Array.isArray(body.welcome.cards)) doc.welcome.cards = body.welcome.cards;
  }

  // STATS
  if (Array.isArray(body.stats)) doc.stats = body.stats;

  // ABOUT (images handled in file upload step)
  if (Array.isArray(body.about)) doc.about = body.about;

  // CONFERENCES (images handled in file upload step)
  if (Array.isArray(body.conferences)) doc.conferences = body.conferences;

  // SUSTAINABLE
  if (body.sustainableConferences) {
    doc.sustainableConferences.content =
      body.sustainableConferences.content ?? doc.sustainableConferences.content;
    doc.sustainableConferences.imageAlt =
      body.sustainableConferences.imageAlt ?? doc.sustainableConferences.imageAlt;
  }

  // TESTIMONIALS (photos handled in file upload step)
  if (Array.isArray(body.testimonials)) doc.testimonials = body.testimonials;
};

const applyFileUploads = async (doc, req) => {
  const files = req.files || {};

  // HERO images (field: heroImages - single or multiple)
  if (files.heroImages) {
    const arr = Array.isArray(files.heroImages) ? files.heroImages : [files.heroImages];

    // delete previous local images
    if (doc.hero?.images?.length) {
      for (const img of doc.hero.images) {
        if (img.src?.startsWith('/uploads/')) await deleteFile(img.src);
      }
    }

    const uploaded = [];
    for (const f of arr) {
      const saved = await uploadFile(f, 'home');
      if (saved) uploaded.push({ src: saved, alt: f.name || 'Hero image' });
    }
    if (uploaded.length) doc.hero.images = uploaded;
  }

  // WELCOME card images: fields welcomeCardImgs0, welcomeCardImgs1, ...
  if (Array.isArray(doc.welcome?.cards)) {
    for (let i = 0; i < doc.welcome.cards.length; i++) {
      const key = `welcomeCardImgs${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.welcome.cards[i].image;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'home');
        if (saved) doc.welcome.cards[i].image = saved;
      }
    }
  }

  // ABOUT block images: fields aboutImgs0, aboutImgs1, ...
  if (Array.isArray(doc.about)) {
    for (let i = 0; i < doc.about.length; i++) {
      const key = `aboutImgs${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.about[i].image;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'home');
        if (saved) doc.about[i].image = saved;
      }
    }
  }

  // CONFERENCE images: fields conferenceImgs0, conferenceImgs1, ...
  if (Array.isArray(doc.conferences)) {
    for (let i = 0; i < doc.conferences.length; i++) {
      const key = `conferenceImgs${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.conferences[i].img;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'home');
        if (saved) doc.conferences[i].img = saved;
      }
    }
  }

  // SUSTAINABLE image: field sustainImage
  if (files.sustainImage) {
    const prev = doc.sustainableConferences?.image;
    if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
    const saved = await uploadFile(files.sustainImage, 'home');
    if (saved) doc.sustainableConferences.image = saved;
  }

  // TESTIMONIAL photos: fields testimonialPhotos0, testimonialPhotos1, ...
  if (Array.isArray(doc.testimonials)) {
    for (let i = 0; i < doc.testimonials.length; i++) {
      const key = `testimonialPhotos${i}`;
      if (files[key]) {
        const f = files[key];
        const prev = doc.testimonials[i].photo;
        if (prev && prev.startsWith('/uploads/')) await deleteFile(prev);
        const saved = await uploadFile(f, 'home');
        if (saved) doc.testimonials[i].photo = saved;
      }
    }
  }
};

/** GET /api/home (returns the single doc; creates one if none) */
exports.getHome = async (req, res) => {
  try {
    let home = await Home.findOne();
    if (!home) home = await Home.create({});
    return res.json(home);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** POST /api/home (create) */
exports.createHome = async (req, res) => {
  try {
    const body = parseBodyArrays(req.body || {});
    const home = new Home();
    applyPlainUpdates(home, body);
    await applyFileUploads(home, req);
    await home.save();
    return res.status(201).json(home);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /api/home/:id (partial update) */
exports.updateHome = async (req, res) => {
  try {
    const { id } = req.params;
    const home = await Home.findById(id);
    if (!home) return res.status(404).json({ message: 'Home not found' });

    const body = parseBodyArrays(req.body || {});
    applyPlainUpdates(home, body);
    await applyFileUploads(home, req);

    await home.save();
    return res.json(home);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** DELETE /api/home/:id (delete doc + any local images we own) */
exports.deleteHome = async (req, res) => {
  try {
    const { id } = req.params;
    const home = await Home.findById(id);
    if (!home) return res.status(404).json({ message: 'Home not found' });

    // collect and delete local image files
    const candidates = [];

    // hero
    (home.hero?.images || []).forEach(i => i?.src && i.src.startsWith('/uploads/') && candidates.push(i.src));
    // welcome cards
    (home.welcome?.cards || []).forEach(c => c?.image && c.image.startsWith('/uploads/') && candidates.push(c.image));
    // about blocks
    (home.about || []).forEach(b => b?.image && b.image.startsWith('/uploads/') && candidates.push(b.image));
    // conferences
    (home.conferences || []).forEach(c => c?.img && c.img.startsWith('/uploads/') && candidates.push(c.img));
    // sustainable
    if (home.sustainableConferences?.image?.startsWith('/uploads/')) candidates.push(home.sustainableConferences.image);
    // testimonials
    (home.testimonials || []).forEach(t => t?.photo && t.photo.startsWith('/uploads/') && candidates.push(t.photo));

    for (const p of candidates) {
      try { await deleteFile(p); } catch (e) { /* ignore */ }
    }

    await Home.findByIdAndDelete(id);
    return res.json({ message: 'Home deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
};
