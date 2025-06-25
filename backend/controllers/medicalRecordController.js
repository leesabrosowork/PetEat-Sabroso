const PetMedicalRecord = require('../models/petMedicalRecord');

// GET: View pet medical record (all authenticated users)
exports.getMedicalRecord = async (req, res) => {
  try {
    const record = await PetMedicalRecord.findOne({ petId: req.params.petId });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST: Add new medical record (veterinarian only)
exports.createMedicalRecord = async (req, res) => {
  try {
    const newRecord = new PetMedicalRecord(req.body);
    await newRecord.save();
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('emrs_updated');
    }
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT: Edit medical record (veterinarian only)
exports.updateMedicalRecord = async (req, res) => {
  try {
    const updated = await PetMedicalRecord.findOneAndUpdate(
      { petId: req.params.petId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Record not found' });
    if (req.app && req.app.get('io')) {
      req.app.get('io').emit('emrs_updated');
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};