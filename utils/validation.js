const Joi = require('joi');

const expenseValidation = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    }),
  description: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Description cannot be empty',
      'any.required': 'Description is required'
    }),
  paid_by: Joi.string().trim().min(1).required()
    .messages({
      'string.empty': 'Paid by cannot be empty',
      'any.required': 'Paid by is required'
    }),
  split_among: Joi.array().items(Joi.string().trim().min(1)).default([]),
  split_type: Joi.string().valid('equal', 'exact', 'percentage').default('equal'),
  category: Joi.string().trim().default('General'),
  exact_shares: Joi.object().pattern(Joi.string(), Joi.number().positive()),
  percentages: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(100))
});

const updateExpenseValidation = Joi.object({
  amount: Joi.number().positive().precision(2),
  description: Joi.string().trim().min(1).max(200),
  paid_by: Joi.string().trim().min(1),
  split_among: Joi.array().items(Joi.string().trim().min(1)),
  split_type: Joi.string().valid('equal', 'exact', 'percentage'),
  category: Joi.string().trim(),
  exact_shares: Joi.object().pattern(Joi.string(), Joi.number().positive()),
  percentages: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(100))
});

const validateExpense = (req, res, next) => {
  const { error, value } = expenseValidation.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateUpdateExpense = (req, res, next) => {
  const { error, value } = updateExpenseValidation.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateExpense,
  validateUpdateExpense
};