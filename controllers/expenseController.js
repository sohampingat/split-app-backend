const Expense = require("../models/Expense");
const { createEqualSplits } = require("../utils/settlementCalculator");

exports.addExpense = async (req, res) => {
  try {
    const { amount, description, paid_by, splits, split_among } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount is required and must be positive" 
      });
    }
    
    if (!description || description.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Description is required" 
      });
    }
    
    if (!paid_by || paid_by.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Paid by is required" 
      });
    }

    let finalSplits;
    
    // Handle different splitting options
    if (splits && Array.isArray(splits) && splits.length > 0) {
      // Custom splits provided
      const totalSplit = splits.reduce((sum, split) => sum + split.share, 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Split amounts (${totalSplit}) don't match expense amount (${amount})`
        });
      }
      finalSplits = splits;
    } else if (split_among && Array.isArray(split_among) && split_among.length > 0) {
      // Equal split among specified people
      finalSplits = createEqualSplits(amount, split_among);
    } else {
      // Default: split equally between payer and themselves (useful for single person expenses)
      finalSplits = createEqualSplits(amount, [paid_by]);
    }

    // Validate splits
    for (const split of finalSplits) {
      if (!split.person || split.person.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "All split entries must have a valid person name"
        });
      }
      if (!split.share || split.share < 0) {
        return res.status(400).json({
          success: false,
          message: "All split shares must be positive"
        });
      }
    }

    const expense = new Expense({ 
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      description: description.trim(), 
      paid_by: paid_by.trim(), 
      splits: finalSplits 
    });
    
    await expense.save();
    res.status(201).json({ 
      success: true, 
      data: expense, 
      message: "Expense added successfully" 
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { amount, description, paid_by, splits, split_among } = req.body;
    
    // Find existing expense
    const existingExpense = await Expense.findById(req.params.id);
    if (!existingExpense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // Prepare update data
    const updateData = {};
    
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Amount must be positive" 
        });
      }
      updateData.amount = Math.round(amount * 100) / 100;
    }
    
    if (description !== undefined) {
      if (description.trim() === "") {
        return res.status(400).json({ 
          success: false, 
          message: "Description cannot be empty" 
        });
      }
      updateData.description = description.trim();
    }
    
    if (paid_by !== undefined) {
      if (paid_by.trim() === "") {
        return res.status(400).json({ 
          success: false, 
          message: "Paid by cannot be empty" 
        });
      }
      updateData.paid_by = paid_by.trim();
    }

    // Handle splits update
    if (splits || split_among) {
      const finalAmount = updateData.amount || existingExpense.amount;
      
      if (splits && Array.isArray(splits) && splits.length > 0) {
        const totalSplit = splits.reduce((sum, split) => sum + split.share, 0);
        if (Math.abs(totalSplit - finalAmount) > 0.01) {
          return res.status(400).json({
            success: false,
            message: `Split amounts (${totalSplit}) don't match expense amount (${finalAmount})`
          });
        }
        updateData.splits = splits;
      } else if (split_among && Array.isArray(split_among) && split_among.length > 0) {
        updateData.splits = createEqualSplits(finalAmount, split_among);
      }
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.json({ 
      success: true, 
      data: updated, 
      message: "Expense updated successfully" 
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid expense ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: "Expense not found" 
      });
    }
    res.json({ 
      success: true, 
      message: "Expense deleted successfully",
      data: deleted 
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid expense ID" 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};
