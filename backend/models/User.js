const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Student', 'Subject Teacher', 'Mentor', 'HOD', 'Principal', 'Chairman', 'Maintenance Technician', 'Security Officer', 'Event Organizer', 'Transport Coordinator', 'Librarian', 'Admin'] },
  name: { type: String, required: true },
  department: { type: String, required: true },
  studentId: { type: String, default: null }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', UserSchema);
