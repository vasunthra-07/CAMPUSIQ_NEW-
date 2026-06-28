require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function migratePasswords() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const users = await User.find();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
        skippedCount++;
        continue;
      }
      
      // Mark the password as modified so the pre-save hook picks it up and hashes it
      user.markModified('password');
      await user.save();
      migratedCount++;
    }

    console.log(`Migration Complete.`);
    console.log(`Migrated users: ${migratedCount}`);
    console.log(`Skipped users (already hashed): ${skippedCount}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePasswords();
