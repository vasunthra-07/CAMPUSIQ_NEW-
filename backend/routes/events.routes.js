const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/events', verifyToken, async (req, res) => {
  try {
    const events = await Event.find().sort({ startTime: 1 });
    res.json({ success: true, data: events });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/events', verifyToken, requireRole(['Event Organizer', 'Admin', 'HOD', 'Principal']), async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user.id });
    res.json({ success: true, data: event });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/events/:id/register', verifyToken, async (req, res) => {
  try {
    const reg = await EventRegistration.create({ eventId: req.params.id, userId: req.user.id });
    res.json({ success: true, data: reg });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
