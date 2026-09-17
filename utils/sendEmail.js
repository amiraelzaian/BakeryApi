const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const sendEmail = async (options) => {
  console.log("sendEmail called with:", options.email);

  const addresses = await dns.resolve4(process.env.EMAIL_HOST);
  const ipv4Address = addresses[0];

  console.log("Resolved", process.env.EMAIL_HOST, "to IPv4:", ipv4Address);

  const transporter = nodemailer.createTransport({
    host: ipv4Address,
    port: Number(process.env.EMAIL_PORT), 
    secure: false, 
    requireTLS: true, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      servername: process.env.EMAIL_HOST,
    },
    connectionTimeout: 15000, 
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
