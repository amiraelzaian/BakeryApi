// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Bakery App" <${process.env.EMAIL_USER}>`,
//     to: options.email,
//     subject: options.subject,
//     html: options.message,
//   });
// };

// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   console.log("sendEmail called with:", options.email);
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number(process.env.EMAIL_PORT),
//     secure: Number(process.env.EMAIL_PORT) === 465,
//      family: 4,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   try {
//     await transporter.sendMail({
//       from: `"Bakery App" <${process.env.EMAIL_USER}>`,
//       to: options.email,
//       subject: options.subject,
//       html: options.message,
//     });
//   } catch (err) {
//     console.error("SEND EMAIL ERROR:", err); // ← add this
//     throw err; // re-throw so the controller's catch still handles it
//   }
// };

// module.exports = sendEmail;

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    await resend.emails.send({
      from: "Bakery App <onboarding@resend.dev>", // or your verified domain
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
