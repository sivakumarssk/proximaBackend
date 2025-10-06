const Sponsor = require('../models/Sponsor');

// ➕ Create sponsor
exports.createSponsor = async (req, res) => {
  try {
    const sponsor = await Sponsor.create(req.body);
    res.status(201).json({ success: true, data: sponsor });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 📋 Get all
exports.getSponsors = async (req, res) => {
  try {
    const sponsors = await Sponsor.find()
      .populate("sponsor", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: sponsors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ❌ Delete sponsor
exports.deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Sponsor.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
