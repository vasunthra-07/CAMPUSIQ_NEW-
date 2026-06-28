const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/resources', verifyToken, async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json({ success: true, data: resources });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/bookings', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, bookedBy: req.user.id });
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const filter = ['HOD', 'Principal', 'Admin'].includes(req.user.role) ? {} : { bookedBy: req.user.id };
    const bookings = await Booking.find(filter).populate('resourceId').populate('bookedBy', 'name');
    res.json({ success: true, data: bookings });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/bookings/:id', verifyToken, requireRole(['HOD', 'Principal', 'Admin']), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
