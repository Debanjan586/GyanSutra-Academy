import { body } from 'express-validator';

export const courseRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('shortDescription')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 }).withMessage('Short description cannot exceed 300 characters'),

  body('category')
    .optional({ checkFalsy: true })
    .trim(),

  body('level')
    .optional({ checkFalsy: true })
    .isIn(['Beginner', 'Intermediate', 'Advanced', ''])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),

  body('duration')
    .optional({ checkFalsy: true })
    .trim(),

  body('regularPrice')
    .notEmpty().withMessage('Regular price is required')
    .isFloat({ min: 0 }).withMessage('Regular price must be a non-negative number'),

  body('offerPrice')
    .optional({ nullable: true })
    .custom((val, { req }) => {
      if (val === null || val === '' || val === undefined) return true;
      const offer = parseFloat(val);
      const regular = parseFloat(req.body.regularPrice);
      if (isNaN(offer) || offer < 0) throw new Error('Offer price must be a non-negative number');
      if (offer >= regular) throw new Error('Offer price must be less than the regular price');
      return true;
    }),

  body('image')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val) => {
      if (!val) return true;
      try {
        const url = new URL(val);
        if (url.protocol !== 'https:') throw new Error();
        return true;
      } catch {
        throw new Error('Image must be a valid HTTPS URL');
      }
    }),

  body('published')
    .optional()
    .isBoolean().withMessage('Published must be true or false'),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
];

/* Partial update rules — all fields optional (used for PATCH) */
export const coursePatchRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('shortDescription')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 }).withMessage('Short description cannot exceed 300 characters'),

  body('category').optional({ checkFalsy: true }).trim(),
  body('level')
    .optional({ checkFalsy: true })
    .isIn(['Beginner', 'Intermediate', 'Advanced', ''])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),

  body('duration').optional({ checkFalsy: true }).trim(),

  body('regularPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Regular price must be a non-negative number'),

  body('offerPrice')
    .optional({ nullable: true })
    .custom((val, { req }) => {
      if (val === null || val === '' || val === undefined) return true;
      const offer = parseFloat(val);
      const regular = parseFloat(req.body.regularPrice);
      if (isNaN(offer) || offer < 0) throw new Error('Offer price must be a non-negative number');
      if (!isNaN(regular) && offer >= regular)
        throw new Error('Offer price must be less than the regular price');
      return true;
    }),

  body('image')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val) => {
      if (!val) return true;
      try {
        const url = new URL(val);
        if (url.protocol !== 'https:') throw new Error();
        return true;
      } catch {
        throw new Error('Image must be a valid HTTPS URL');
      }
    }),

  body('published')
    .optional()
    .isBoolean().withMessage('Published must be true or false'),

  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
];