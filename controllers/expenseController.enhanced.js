const { validationResult } = require('express-validator');
const Expense = require("../models/Expense");
const User = require("../models/User");
const Group = require("../models/Group");
const { createEqualSplits } = require("../utils/settlementCalculator");

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      amount, 
      description, 
      category, 
      paid_by, 
      group, 
      splits, 
      split_among, 
      split_type,
      notes,
      tags 
    } = req.body;

    const userId = req.user.id;

    // Validate payer
    let payer;
    if (paid_by) {
      payer = await User.findById(paid_by);
      if (!payer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payer ID'
        });
      }
    } else {
      payer = req.user; // Default to current user
    }

    // Validate group if provided
    let groupData = null;
    if (group) {
      groupData = await Group.findOne({
        _id: group,
        'members.user': userId,
        isActive: true
      });
      
      if (!groupData) {
        return res.status(400).json({
          success: false,
          message: 'Group not found or you are not a member'
        });
      }
    }

    let finalSplits = [];

    // Handle different splitting scenarios
    if (splits && Array.isArray(splits) && splits.length > 0) {
      // Custom splits provided
      let totalSplit = 0;
      
      for (const split of splits) {
        const user = await User.findById(split.person);
        if (!user) {
          return res.status(400).json({
            success: false,
            message: `User not found for split: ${split.person}`
          });
        }
        
        finalSplits.push({
          person: user._id,
          person_name: user.name,
          share: split.share
        });
        totalSplit += split.share;
      }
      
      if (Math.abs(totalSplit - amount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Split amounts (${totalSplit}) don't match expense amount (${amount})`
        });
      }
    } else if (split_among && Array.isArray(split_among) && split_among.length > 0) {
      // Equal split among specified people
      const sharePerPerson = amount / split_among.length;
      
      for (const personId of split_among) {
        const user = await User.findById(personId);
        if (!user) {
          return res.status(400).json({
            success: false,
            message: `User not found: ${personId}`
          });
        }
        
        finalSplits.push({
          person: user._id,
          person_name: user.name,
          share: Math.round(sharePerPerson * 100) / 100
        });
      }
    } else {
      // Default: expense paid by user for themselves
      finalSplits = [{
        person: payer._id,
        person_name: payer.name,
        share: amount
      }];
    }

    // Create expense
    const expense = new Expense({
      amount: Math.round(amount * 100) / 100,
      description: description.trim(),
      category: category || 'General',
      paid_by: payer._id,
      paid_by_name: payer.name,
      group: groupData ? groupData._id : null,
      splits: finalSplits,
      split_type: split_type || 'equal',
      notes: notes || '',
      tags: tags || []
    });

    await expense.save();

    // Update group total if applicable
    if (groupData) {
      await Group.findByIdAndUpdate(groupData._id, {
        $inc: { totalExpenses: amount }
      });
    }

    // Populate expense for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate('paid_by', 'name email avatar')
      .populate('splits.person', 'name email avatar')
      .populate('group', 'name description');

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: {
        expense: populatedExpense
      }
    });

  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expense'
    });
  }
};

// @desc    Get expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { group, category, limit = 50, page = 1 } = req.query;

    const query = {
      is_deleted: false,
      $or: [
        { paid_by: userId },
        { 'splits.person': userId }
      ]
    };

    if (group) {
      query.group = group;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('paid_by', 'name email avatar')
      .populate('splits.person', 'name email avatar')
      .populate('group', 'name description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalExpenses: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses'
    });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findOne({
      _id: id,
      is_deleted: false,
      $or: [
        { paid_by: userId },
        { 'splits.person': userId }
      ]
    })
    .populate('paid_by', 'name email avatar')
    .populate('splits.person', 'name email avatar')
    .populate('group', 'name description');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: {
        expense
      }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, description, category, notes, tags } = req.body;

    const expense = await Expense.findOne({
      _id: id,
      is_deleted: false,
      paid_by: userId // Only creator can update
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you are not authorized to update it'
      });
    }

    // Update fields
    if (amount !== undefined) expense.amount = Math.round(amount * 100) / 100;
    if (description !== undefined) expense.description = description.trim();
    if (category !== undefined) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (tags !== undefined) expense.tags = tags;

    // If amount changed, recalculate splits
    if (amount !== undefined && expense.split_type === 'equal') {
      const sharePerPerson = expense.amount / expense.splits.length;
      expense.splits = expense.splits.map(split => ({
        ...split,
        share: Math.round(sharePerPerson * 100) / 100
      }));
    }

    await expense.save();

    const updatedExpense = await Expense.findById(id)
      .populate('paid_by', 'name email avatar')
      .populate('splits.person', 'name email avatar')
      .populate('group', 'name description');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        expense: updatedExpense
      }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense'
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findOne({
      _id: id,
      is_deleted: false,
      paid_by: userId // Only creator can delete
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or you are not authorized to delete it'
      });
    }

    // Soft delete
    expense.is_deleted = true;
    await expense.save();

    // Update group total if applicable
    if (expense.group) {
      await Group.findByIdAndUpdate(expense.group, {
        $inc: { totalExpenses: -expense.amount }
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense'
    });
  }
};

// @desc    Get expense categories
// @route   GET /api/expenses/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = [
      'Food & Dining',
      'Transport',
      'Entertainment',
      'Shopping',
      'Utilities',
      'Travel',
      'Health',
      'General',
      'Other'
    ];

    res.json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getCategories
};