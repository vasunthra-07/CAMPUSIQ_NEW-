const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const filter = ['Maintenance Technician', 'Admin', 'Principal'].includes(req.user.role) ? {} : { raisedBy: req.user.id };
    const tickets = await Ticket.find(filter).populate('raisedBy', 'name');
    res.json({ success: true, data: tickets });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/tickets', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.create({ ...req.body, raisedBy: req.user.id });
    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/tickets/:id', verifyToken, requireRole(['Maintenance Technician', 'Admin', 'Principal']), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
