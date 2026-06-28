const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// This depends on the process.env.JWT_SECRET being set in server.js before these routes run

router.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;

    const token = jwt.sign(
      { id: user._id, userId: user.userId, name: user.name, role: user.role, department: user.department, studentId: user.studentId },
      jwtSecret,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      user: { userId: user.userId, name: user.name, role: user.role, department: user.department, studentId: user.studentId }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
