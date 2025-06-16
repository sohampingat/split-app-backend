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
  paid_by: {
    type: String,
    required: [true, "Paid By is required"]
  },
  splits: [
    {
      person: { type: String, required: true },
      share: {
        type: Number,
        required: true,
        min: [0, "Share must be non-negative"]
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
