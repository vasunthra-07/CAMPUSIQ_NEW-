const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  serialNumber: { type: String, required: true },
  location: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  warrantyExpiry: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'UnderMaintenance', 'Retired'], default: 'Active' },
  expectedLifespanMonths: { type: Number, required: true },
  incidentCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);
