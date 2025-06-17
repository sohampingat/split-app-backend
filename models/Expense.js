const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"]
  },
  description: {
    type: String,
    required: [true, "Description is required"]
  },
  category: {
    type: String,
    default: 'General',
    enum: ['Food & Dining', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Travel', 'Health', 'General', 'Other']
  },
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Paid By is required"]
  },
  paid_by_name: {
    type: String,
    required: true // Keep for backward compatibility
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // null means personal expense
  },
  splits: [
    {
      person: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
      },
      person_name: { 
        type: String, 
        required: true // For display purposes
      },
      share: {
        type: Number,
        required: true,
        min: [0, "Share must be non-negative"]
      },
      settled: {
        type: Boolean,
        default: false
      },
      settled_at: {
        type: Date,
        default: null
      }
    }
  ],
  split_type: {
    type: String,
    enum: ['equal', 'exact', 'percentage'],
    default: 'equal'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  receipt_url: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    default: ''
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
expenseSchema.index({ paid_by: 1 });
expenseSchema.index({ group: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ 'splits.person': 1 });

module.exports = mongoose.model("Expense", expenseSchema);
