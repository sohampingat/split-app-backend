const { body } = require('express-validator');

// User registration validation
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

// Expense validation
const validateExpense = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  
  body('category')
    .optional()
    .isIn(['Food & Dining', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Travel', 'Health', 'General', 'Other'])
    .withMessage('Invalid category'),
  
  body('split_among')
    .isArray({ min: 1 })
    .withMessage('At least one person must be included in the split'),
  
  body('split_type')
    .optional()
    .isIn(['equal', 'exact', 'percentage'])
    .withMessage('Invalid split type')
];

// Group validation
const validateGroup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Group name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array')
];

// Settlement validation
const validateSettlement = [
  body('from')
    .isMongoId()
    .withMessage('Invalid from user ID'),
  
  body('to')
    .isMongoId()
    .withMessage('Invalid to user ID'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('payment_method')
    .optional()
    .isIn(['cash', 'bank_transfer', 'upi', 'card', 'other'])
    .withMessage('Invalid payment method')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateExpense,
  validateGroup,
  validateSettlement
};