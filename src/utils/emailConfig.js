/**
 * Email configuration and utilities
 */

const nodemailer = require('nodemailer');
const validators = require('./validators');

// Initialize transporter once
let transporter = null;

const initializeEmailTransport = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email sending disabled.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

/**
 * Send email with sanitized content
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!transporter) {
      transporter = initializeEmailTransport();
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }
    }

    // Sanitize inputs
    const sanitizedSubject = validators.sanitizeString(subject);
    const sanitizedText = validators.sanitizeString(text);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: validators.sanitizeString(to),
      subject: sanitizedSubject,
      text: sanitizedText
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    throw new Error('Error sending email');
  }
};

module.exports = {
  initializeEmailTransport,
  sendEmail
};
