const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be greater than 0"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"]
  },
  paid_by: {
    type: String,
    required: [true, "Paid by is required"],
    trim: true
  },
  split_among: [{
    person: {
      type: String,
      required: true,
      trim: true
    },
    share: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  split_type: {
    type: String,
    enum: ['equal', 'exact', 'percentage'],
    default: 'equal'
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate splits before saving
expenseSchema.pre('save', function(next) {
  // If no splits specified, default to equal split with payer only
  if (this.split_among.length === 0) {
    this.split_among = [{
      person: this.paid_by,
      share: this.amount
    }];
  } else if (this.split_type === 'equal') {
    // Ensure equal split
    const sharePerPerson = this.amount / this.split_among.length;
    this.split_among.forEach(split => {
      split.share = Math.round(sharePerPerson * 100) / 100;
    });
  }
  
  // Validate total shares
  const totalShares = this.split_among.reduce((sum, split) => sum + split.share, 0);
  if (Math.abs(totalShares - this.amount) > 0.01) {
    return next(new Error('Total shares must equal the expense amount'));
  }
  
  next();
});

// Virtual for formatted amount
expenseSchema.virtual('formatted_amount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

module.exports = mongoose.model("ExpenseClean", expenseSchema);