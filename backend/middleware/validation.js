const { body, validationResult } = require('express-validator');
const { USER_ROLES } = require('../constants');

/**
 * Validation middleware to check for errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn([USER_ROLES.CLIENT, USER_ROLES.FREELANCER])
    .withMessage('Role must be either client or freelancer'),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Gig creation validation
 */
const validateGig = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('budget.min')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget.max')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Maximum budget must be a positive number'),
  body('deadline')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid deadline date'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Each skill must be a non-empty string'),
  body('budget').custom((budget) => {
    if (budget.min > budget.max) {
      throw new Error('Minimum budget cannot be greater than maximum budget');
    }
    return true;
  }),
  body('deadline').custom((deadline) => {
    if (new Date(deadline) <= new Date()) {
      throw new Error('Deadline must be in the future');
    }
    return true;
  }),
  handleValidationErrors
];

/**
 * Bid submission validation
 */
const validateBid = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Bid amount must be a positive number'),
  body('proposal')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Proposal must be between 10 and 1000 characters'),
  body('deliveryTime')
    .isInt({ min: 1, max: 365 })
    .withMessage('Delivery time must be between 1 and 365 days'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateGig,
  validateBid,
  handleValidationErrors
};