/**
 * Input validation utilities
 */

const validator = require('validator');

const validators = {
  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    return validator.isEmail(email);
  },

  /**
   * Validate strong password (8+ chars, uppercase, lowercase, number, special char)
   */
  isValidPassword: (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Validate IP address format
   */
  isValidIP: (ip) => {
    return validator.isIP(ip);
  },

  /**
   * Validate MongoDB ObjectID
   */
  isValidMongoID: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  /**
   * Sanitize string input (XSS prevention)
   */
  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return validator.escape(str).trim();
  },

  /**
   * Validate string length
   */
  isValidLength: (str, min = 0, max = null) => {
    const len = String(str).length;
    if (len < min) return false;
    if (max !== null && len > max) return false;
    return true;
  },

  /**
   * Validate filename (prevent directory traversal)
   */
  isValidFilename: (filename) => {
    if (!filename || typeof filename !== 'string') return false;
    // Prevent directory traversal and special characters
    return !/[\/\\:\*\?"<>|\x00-\x1f]/g.test(filename) && filename.length > 0;
  },

  /**
   * Trim and validate required fields
   */
  validateRequiredFields: (obj, fields) => {
    const errors = {};
    fields.forEach((field) => {
      const value = obj[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = `${field} es requerido`;
      }
    });
    return Object.keys(errors).length === 0 ? null : errors;
  }
};

module.exports = validators;
