const nodemailer = require('nodemailer');

// ANSI Color Escapes for terminal
const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const PURPLE = '\x1b[35m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

// Initialize Twilio Client conditionally
let twilioClient = null;
try {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token && sid.trim() !== '' && token.trim() !== '') {
    const twilio = require('twilio');
    twilioClient = twilio(sid, token);
  }
} catch (err) {
  console.error('Failed to initialize Twilio client:', err.message);
}

// Helper to get Nodemailer SMTP transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Sends Twilio SMS/WhatsApp alert dispatch
 * @param {string} phone - Recipient phone number
 * @param {string} message - Text message content
 */
const sendSMSAlert = async (phone, message) => {
  // 1. Output simulation log
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${BRIGHT}${CYAN}📱 [TWILIO SMS & WHATSAPP GATEWAY DISPATCH]${RESET}`);
  console.log(`${YELLOW}Recipient Phone: ${RESET}${phone || '+91 XXXXX XXXXX'}`);
  console.log(`${YELLOW}Payload Message: ${RESET}"${message}"`);

  // 2. Dispatch real SMS if configured
  const fromNum = process.env.TWILIO_PHONE_NUMBER;
  if (twilioClient && fromNum && fromNum.trim() !== '') {
    try {
      const response = await twilioClient.messages.create({
        body: message,
        from: fromNum,
        to: phone
      });
      console.log(`${YELLOW}Real Delivery:   ${RESET}${GREEN}Sent successfully via Twilio (SID: ${response.sid})${RESET}`);
    } catch (err) {
      console.log(`${YELLOW}Real Delivery:   ${RESET}\x1b[31mFailed: ${err.message}${RESET}`);
    }
  } else {
    console.log(`${YELLOW}Real Delivery:   ${RESET}${YELLOW}Skipped (Twilio credentials not set in .env)${RESET}`);
  }
  console.log(`${CYAN}================================================================${RESET}\n`);
};

/**
 * Sends Nodemailer email dispatch for status alerts
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 */
const sendEmailAlert = async (email, subject, body) => {
  console.log(`\n${PURPLE}================================================================${RESET}`);
  console.log(`${BRIGHT}${PURPLE}📧 [NODEMAILER SMTP EMAIL DISPATCH]${RESET}`);
  console.log(`${YELLOW}Recipient Email:   ${RESET}${email}`);
  console.log(`${YELLOW}Subject:           ${RESET}${subject}`);
  console.log(`${YELLOW}Body Content:      ${RESET}"${body}"`);

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (user && pass && user !== 'mock_user' && pass !== 'mock_pass' && user.trim() !== '' && pass.trim() !== '') {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartShip <no-reply@smartship.com>',
        to: email,
        subject: subject,
        text: body
      });
      console.log(`${YELLOW}Real Delivery:     ${RESET}${GREEN}SMTP Transaction Complete: 250 OK Message sent${RESET}`);
    } catch (err) {
      console.log(`${YELLOW}Real Delivery:     ${RESET}\x1b[31mFailed: ${err.message}${RESET}`);
    }
  } else {
    console.log(`${YELLOW}Real Delivery:     ${RESET}${YELLOW}Skipped (SMTP credentials not configured in .env)${RESET}`);
  }
  console.log(`${PURPLE}================================================================${RESET}\n`);
};

/**
 * Sends Nodemailer/SendGrid email dispatch with PDF attachments
 * @param {string} email - Recipient email address
 * @param {string} invoiceNumber - Target invoice number
 * @param {Buffer} pdfBuffer - Dynamic binary PDF buffer
 */
const sendEmailInvoice = async (email, invoiceNumber, pdfBuffer) => {
  const payloadSizeKb = pdfBuffer ? (pdfBuffer.length / 1024).toFixed(2) : '0.00';
  console.log(`\n${PURPLE}================================================================${RESET}`);
  console.log(`${BRIGHT}${PURPLE}📧 [NODEMAILER SMTP EMAIL INVOICE DISPATCH]${RESET}`);
  console.log(`${YELLOW}Recipient Email:   ${RESET}${email}`);
  console.log(`${YELLOW}Subject:           ${RESET}Invoice confirmation for booking ${invoiceNumber}`);
  console.log(`${YELLOW}Attachment File:   ${RESET}Invoice-${invoiceNumber}.pdf (${payloadSizeKb} KB)`);

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (user && pass && user !== 'mock_user' && pass !== 'mock_pass' && user.trim() !== '' && pass.trim() !== '') {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartShip <no-reply@smartship.com>',
        to: email,
        subject: `Invoice confirmation for booking ${invoiceNumber}`,
        text: `Dear Customer,\n\nPlease find attached the invoice for your shipment booking: ${invoiceNumber}.\n\nThank you for choosing Marine Bytes!`,
        attachments: pdfBuffer ? [
          {
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer
          }
        ] : []
      });
      console.log(`${YELLOW}Real Delivery:     ${RESET}${GREEN}SMTP Transaction Complete: 250 OK Message sent with attachment${RESET}`);
    } catch (err) {
      console.log(`${YELLOW}Real Delivery:     ${RESET}\x1b[31mFailed: ${err.message}${RESET}`);
    }
  } else {
    console.log(`${YELLOW}Real Delivery:     ${RESET}${YELLOW}Skipped (SMTP credentials not configured in .env)${RESET}`);
  }
  console.log(`${PURPLE}================================================================${RESET}\n`);
};

module.exports = {
  sendSMSAlert,
  sendEmailInvoice,
  sendEmailAlert
};
