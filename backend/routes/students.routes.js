const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Alert = require('../models/Alert');
const { verifyToken } = require('../middleware/auth');

// SAVE INTERVENTION
router.post('/interventions', verifyToken, async (req, res) => {
  try {
    const intervention = await Intervention.create({
      studentId: req.body.studentId,
      studentName: req.body.studentName,
      type: req.body.type,
      note: req.body.note,
      createdBy: req.user.name,
      createdByRole: req.user.role
    });
    res.json({ success: true, intervention });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save intervention' });
  }
});

// GET INTERVENTIONS
router.get('/interventions', verifyToken, async (req, res) => {
  try {
    const interventions = await Intervention.find().sort({ createdAt: -1 });
    res.json(interventions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch interventions' });
  }
});

// PARENT ALERT
router.post('/alerts/parent', verifyToken, async (req, res) => {
  try {
    const alert = await Alert.create({
      studentId: req.body.studentId,
      studentName: req.body.studentName,
      message: req.body.message,
      sentBy: req.user.name
    });
    res.json({ success: true, alert });
  } catch {
    res.status(500).json({ error: 'Failed to save alert' });
  }
});

module.exports = router;
