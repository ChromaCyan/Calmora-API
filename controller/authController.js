const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../model/userModel');
const Patient = require('../model/patientModel'); 
const Specialist = require('../model/specialistModel'); 

const JWT_SECRET = process.env.JWT_SECRET || '123_123';
const otps = {};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"Armstrong Support" <${process.env.EMAIL}>`, 
            to: email,
            subject: 'Welcome to Armstrong - Verify Your Email',
            text: `Welcome to Armstrong!

We’re excited to have you on board. To complete your sign-up, please use the following OTP to verify your email:

OTP Code: ${otp}

This code will expire in 5 minutes. Please do not share it with anyone.

If you did not create an account with Armstrong, you can safely ignore this email.

Thank you,  
The Armstrong Team`
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

// OTP Verification
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    const storedOTP = otps[email];

    if (!storedOTP) {
        return res.status(404).json({ success: false, message: 'No OTP found for this email' });
    }

    if (storedOTP.expires < Date.now()) {
        delete otps[email];
        return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (storedOTP.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    delete otps[email];
    return res.status(200).json({ success: true, message: 'OTP verified' });
};

// Register User
exports.createUser = async (req, res) => {
    const { firstName, lastName, email, password, ...otherDetails } = req.body;

    try {
        const lowerCaseEmail = email.toLowerCase();

        // Check if email already exists
        const existingUser = await User.findOne({ email: lowerCaseEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let newUser;

        if (req.body.specialization) { 
            newUser = new Specialist({ firstName, lastName, email: lowerCaseEmail, password, ...otherDetails });
        } else { 
            newUser = new Patient({ firstName, lastName, email: lowerCaseEmail, password, ...otherDetails });
        }

        await newUser.save();

        const otp = generateOTP();
        otps[lowerCaseEmail] = { otp, expires: Date.now() + 300000 }; // OTP expires in 5 minutes
        await sendEmail(lowerCaseEmail, otp);

        const token = jwt.sign({ id: newUser._id, userType: newUser.userType }, JWT_SECRET, { expiresIn: '3h' });

        res.status(201).json({ message: 'User created successfully, OTP sent', token, userId: newUser._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
        const lowerCaseEmail = email.toLowerCase();

        const user = await User.findOne({ email: email.toLowerCase() });
  
      if (!user) {
        user = await Patient.findOne({ email: lowerCaseEmail }) || await Specialist.findOne({ email: lowerCaseEmail });
      }
  
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Generate JWT token with the user ID and userType
      const token = jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '3h' });
  
      // Respond with the token, user ID, and userType
      res.status(200).json({
        token,
        userId: user._id,
        userType: user.userType,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };