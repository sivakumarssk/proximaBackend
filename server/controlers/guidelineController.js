const Guideline = require('../models/Guideline');

// 🟢 Create or update guidelines (only one document)
const saveGuideline = async (req, res) => {
  try {
    const { speaker } = req.body;

    let guideline = await Guideline.findOne();
    if (guideline) {
      guideline.speaker = speaker;
      await guideline.save();
    } else {
      guideline = await Guideline.create({ speaker });
    }

    res.json({ success: true, data: guideline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save guideline" });
  }
};

// 🟢 Get guidelines
const getGuideline = async (req, res) => {
  try {
    const guideline = await Guideline.findOne();
    res.json({ success: true, data: guideline });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch guideline" });
  }
};

module.exports = {
  saveGuideline,
  getGuideline
};