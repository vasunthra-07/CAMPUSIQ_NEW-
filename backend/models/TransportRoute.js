const mongoose = require('mongoose');

const TransportRouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  stops: [{
    name: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    order: { type: Number, required: true }
  }],
  driverName: { type: String, required: true },
  vehicleNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TransportRoute', TransportRouteSchema);
