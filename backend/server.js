require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const authRoutes = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const aiRoutes = require('./routes/ai.routes');
const resourcesRoutes = require('./routes/resources.routes');
const eventsRoutes = require('./routes/events.routes');
const ticketsRoutes = require('./routes/tickets.routes');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET is not defined in production.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is missing. Generating a random secret for development.');
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'CampusIQ Backend Running',
    version: '2.0',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', studentsRoutes); // Includes /interventions, /alerts/parent
app.use('/api/ai', aiRoutes);
app.use('/api', resourcesRoutes);
app.use('/api', eventsRoutes);
app.use('/api', ticketsRoutes);

app.listen(PORT, () => {
  console.log('\n CampusIQ Backend Running');
  console.log(' API: http://localhost:' + PORT);
  console.log(' DB:  MongoDB Atlas');
  console.log(' AI:  Ollama :11434\n');
});
