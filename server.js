const express = require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// OTP Schema
const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  timestamp: { type: Date, default: Date.now }
});

const OTP = mongoose.model('OTP', otpSchema);

// Nodemailer Setup with app password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use the generated app password
  }
});

// Send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Random OTP
  
  const newOtp = new OTP({
    email,
    otp
  });
  
  await newOtp.save();

  // Send OTP email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return res.status(500).json({ message: 'Error sending OTP' });
    }
    res.status(200).json({ message: 'OTP sent successfully!' });
  });
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  const otpRecord = await OTP.findOne({ email, otp });
  
  if (!otpRecord) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // OTP validation passed
  res.status(200).json({ message: 'OTP verified successfully!' });
});

// Server Setup
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
