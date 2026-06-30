require('dns').setDefaultResultOrder('ipv4first');
const dns = require('dns').promises;
const net = require('net');
const nodemailer = require('nodemailer');

// Disable Happy Eyeballs globally for this process
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

function buildOtpEmailHtml(name, otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #2d8a6b; margin-bottom: 8px;">PlantCare</h2>
      <p>Hello ${name},</p>
      <p>Use the verification code below to complete your PlantCare account setup:</p>
      <div style="background: #f4faf7; border: 2px dashed #2d8a6b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2d8a6b;">${otp}</span>
      </div>
      <p style="color: #555;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #888; font-size: 13px;">If you did not create a PlantCare account, you can safely ignore this email.</p>
    </div>
  `;
}

const sendEmail = async (options) => {
  let smtpHost = 'smtp.gmail.com';
  try {
    const addresses = await dns.resolve4('smtp.gmail.com');
    if (addresses.length) {
      smtpHost = addresses[0];
    }
  } catch (e) {
    console.warn('[Email] IPv4 DNS resolve failed, falling back to hostname:', e.message);
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 465,
    secure: true,
    family: 4,
    autoSelectFamily: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',
    },
  });

  const mailOptions = {
    from: '"PlantCare" <' + process.env.EMAIL_USERNAME + '>',
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
module.exports.buildOtpEmailHtml = buildOtpEmailHtml;