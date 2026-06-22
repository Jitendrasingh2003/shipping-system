/**
 * Automated Communications Simulator (SMS & Email)
 * Mock implementation of Twilio & Nodemailer for demonstration purposes.
 * Outputs highly visible, colored terminal alerts when triggered.
 */

// ANSI Color Escapes for terminal
const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const PURPLE = '\x1b[35m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

/**
 * Simulates Twilio SMS/WhatsApp alert dispatch
 * @param {string} phone - Recipient phone number
 * @param {string} message - Text message content
 */
const sendSMSAlert = (phone, message) => {
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${BRIGHT}${CYAN}📱 [TWILIO SMS & WHATSAPP GATEWAY SIMULATION]${RESET}`);
  console.log(`${YELLOW}Recipient Phone: ${RESET}${phone || '+91 XXXXX XXXXX'}`);
  console.log(`${YELLOW}Status:          ${RESET}${GREEN}Delivered successfully via Twilio carrier route${RESET}`);
  console.log(`${YELLOW}Payload Message: ${RESET}"${message}"`);
  console.log(`${CYAN}================================================================${RESET}\n`);
};

/**
 * Simulates Nodemailer/SendGrid email dispatch with PDF attachments
 * @param {string} email - Recipient email address
 * @param {string} invoiceNumber - Target invoice number
 * @param {Buffer} pdfBuffer - Dynamic binary PDF buffer
 */
const sendEmailInvoice = (email, invoiceNumber, pdfBuffer) => {
  const payloadSizeKb = pdfBuffer ? (pdfBuffer.length / 1024).toFixed(2) : '0.00';
  console.log(`\n${PURPLE}================================================================${RESET}`);
  console.log(`${BRIGHT}${PURPLE}📧 [NODEMAILER SMTP EMAIL GATEWAY SIMULATION]${RESET}`);
  console.log(`${YELLOW}Recipient Email:   ${RESET}${email}`);
  console.log(`${YELLOW}Subject:           ${RESET}Invoice confirmation for booking ${invoiceNumber}`);
  console.log(`${YELLOW}SMTP Server:       ${RESET}smtp.sendgrid.net (TLS Port 587 Secured)`);
  console.log(`${YELLOW}Attachment File:   ${RESET}Invoice-${invoiceNumber}.pdf (${payloadSizeKb} KB bytes)`);
  console.log(`${YELLOW}Status:            ${RESET}${GREEN}SMTP Transaction Complete: 250 OK Message accepted${RESET}`);
  console.log(`${PURPLE}================================================================${RESET}\n`);
};

module.exports = {
  sendSMSAlert,
  sendEmailInvoice
};
