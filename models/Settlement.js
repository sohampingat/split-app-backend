const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"]
  },
  description: {
    type: String,
    default: 'Settlement payment'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  expenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }],
  payment_method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'card', 'other'],
    default: 'other'
  },
  payment_reference: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  settled_at: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
settlementSchema.index({ from: 1, to: 1 });
settlementSchema.index({ group: 1 });
settlementSchema.index({ status: 1 });
settlementSchema.index({ settled_at: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);