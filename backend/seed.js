require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const users = [
  { userId: 'CIT2022001', password: 'student123', role: 'Student', name: 'Arun Kumar', department: 'AI & DS', studentId: 'CIT01' },
  { userId: 'CIT2022002', password: 'student456', role: 'Student', name: 'Priya D.', department: 'AI & DS', studentId: 'CIT02' },
  { userId: 'CIT2022003', password: 'student789', role: 'Student', name: 'Sanjay R.', department: 'AI & DS', studentId: 'CIT03' },
  { userId: 'FAC001', password: 'teacher123', role: 'Subject Teacher', name: 'Dr. S. Kavitha', department: 'AI & DS' },
  { userId: 'MNT001', password: 'mentor123', role: 'Mentor', name: 'Dr. R. Meenakshi', department: 'AI & DS' },
  { userId: 'HOD001', password: 'hod123', role: 'HOD', name: 'Dr. P. Anandan', department: 'AI & DS' },
  { userId: 'PRN001', password: 'principal123', role: 'Principal', name: 'Dr. K. Rajkumar', department: 'CIT' },
  { userId: 'CHR001', password: 'chairman123', role: 'Chairman', name: 'Shri. S. Ramabhadran', department: 'CIT' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');
  await User.deleteMany({});
  await User.insertMany(users);
  console.log('Users seeded successfully');
  console.log('All 8 users created:');
  users.forEach(u => console.log(' -', u.userId, '/', u.password, '→', u.role));
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
