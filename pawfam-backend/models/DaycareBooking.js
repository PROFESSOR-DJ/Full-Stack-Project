const mongoose = require('mongoose');

const DaycareBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Link to the daycare center document (optional, added to support vendor queries)
  daycareCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DaycareCenter'
  },
  // Store vendor reference for quick vendor lookups
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  daycareCenter: {
    name: String,
    location: String,
    pricePerDay: Number
  },
  petName: {
    type: String,
    required: true
  },
  petType: {
    type: String,
    required: true,
    enum: ['Dog', 'Cat', 'Bird', 'Other', 'dog', 'cat', 'bird', 'other']
  },
  petAge: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DaycareBooking', DaycareBookingSchema);