const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //create a transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //Create an options
  const emailOptions = {
    from: options.email,
    to: 'Narendra <hello@gmail.com>',
    subject: options.subject,
    text: options.message,
  };

  //send an Email
  await transporter.sendMail(emailOptions);
};

module.exports = sendEmail;
