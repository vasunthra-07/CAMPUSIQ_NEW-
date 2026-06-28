const jwt = require('jsonwebtoken');

let JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  if (!JWT_SECRET) {
    JWT_SECRET = process.env.JWT_SECRET;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
