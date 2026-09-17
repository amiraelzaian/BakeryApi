const nodemailer = require("nodemailer");
const dns = require("dns");

const sendEmail = async (options) => {
  console.log("sendEmail called with:", options.email);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    lookup: (hostname, opts, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });

  try {
    await transporter.sendMail({
      from: `"Bakery App" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    });
  } catch (err) {
    console.error("SEND EMAIL ERROR:", err);
    throw err;
  }
};

module.exports = sendEmail;
