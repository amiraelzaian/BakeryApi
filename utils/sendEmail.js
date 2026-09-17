const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  console.log("sendEmail called with:", options.email);

  try {
    const { data, error } = await resend.emails.send({
      from: "Bakery App <process.env.EMAIL_USER>", 
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    if (error) {
      console.error("SEND EMAIL ERROR:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data);
  } catch (err) {
    console.error("SEND EMAIL ERROR:", err);
    throw err;
  }
};

module.exports = sendEmail;
