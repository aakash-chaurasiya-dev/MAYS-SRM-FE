// src/utils/validation.js
// Validation utilities for password and Indian mobile numbers

/**
 * Validate password according to requirements:
 * - Minimum length 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (!@#$%^&*)
 * @param {string} password
 * @returns {string|null} Returns error message or null if valid
 */
export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
  if (!/[!@#$%^&]/.test(password)) return 'Password must contain at least one special character (!@#$%^&).';
  return null;
}

/**
 * Validate Indian mobile number (10 digits, starts with 6-9)
 * @param {string} mobile
 * @returns {boolean}
 */
export function validateMobile(mobile) {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(mobile);
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}