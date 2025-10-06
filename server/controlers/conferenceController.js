const Conference = require('../models/Conference');

// ➕ Create Conference
exports.createConference = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    const conf = await Conference.create({ name });
    res.status(201).json({ success: true, data: conf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📋 Get all
exports.getConferences = async (req, res) => {
  try {
    const conferences = await Conference.find().sort({ createdAt: -1 });
    res.json({ success: true, data: conferences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update conference
exports.updateConference = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const conf = await Conference.findByIdAndUpdate(id, { name }, { new: true });
    if (!conf) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: conf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete conference
exports.deleteConference = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Conference.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
