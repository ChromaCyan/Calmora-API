const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require("../model/userModel");
const Patient = require("../model/patientModel");
const Specialist = require("../model/specialistModel");

const JWT_SECRET = process.env.JWT_SECRET || "123_123";
const otps = {};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Armstrong Support" <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to Armstrong - Verify Your Email",
      text: `Welcome to Armstrong!

We’re excited to have you on board. To complete your sign-up, please use the following OTP to verify your email:

OTP Code: ${otp}

This code will expire in 5 minutes. Please do not share it with anyone.

If you did not create an account with Armstrong, you can safely ignore this email.

Thank you,  
The Armstrong Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

// OTP Verification
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const storedOTP = otps[email];

  if (!storedOTP) {
    return res
      .status(404)
      .json({ success: false, message: "No OTP found for this email" });
  }

  if (storedOTP.expires < Date.now()) {
    delete otps[email];
    return res.status(400).json({ success: false, message: "OTP has expired" });
  }

  if (storedOTP.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  delete otps[email];
  return res.status(200).json({ success: true, message: "OTP verified" });
};

// Register User
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, ...otherDetails } = req.body;

  try {
    const lowerCaseEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let newUser;

    if (req.body.specialization) {
      newUser = new Specialist({
        firstName,
        lastName,
        email: lowerCaseEmail,
        password,
        ...otherDetails,
      });
    } else {
      newUser = new Patient({
        firstName,
        lastName,
        email: lowerCaseEmail,
        password,
        ...otherDetails,
      });
    }

    await newUser.save();

    const otp = generateOTP();
    otps[lowerCaseEmail] = { otp, expires: Date.now() + 300000 }; 
    await sendEmail(lowerCaseEmail, otp);

    const token = jwt.sign(
      { id: newUser._id, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.status(201).json({
      message: "User created successfully, OTP sent",
      token,
      userId: newUser._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const lowerCaseEmail = email.toLowerCase();
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = (await Patient.findOne({ email: lowerCaseEmail })) || (await Specialist.findOne({ email: lowerCaseEmail }));
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: "4d" });

    res.status(200).json({
      token,
      userId: user._id,
      userType: user.userType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit logged-in user's profile
exports.editProfile = async (req, res) => {
  const { id, userType } = req.user; 
  const updateData = req.body; 

  try {
    let updatedUser;

    if (userType === "Specialist") {
      updatedUser = await Specialist.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } else if (userType === "Patient") {
      updatedUser = await Patient.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type" });
    }

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of specialists
exports.getSpecialistList = async (req, res) => {
  try {
    const specialists = await Specialist.find({}, "-password"); 
    res.status(200).json({ success: true, data: specialists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get patient-specific data
exports.getPatientData = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id, "-password");

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch a specialist by ID
exports.getSpecialistById = async (req, res) => {
  const { specialistId } = req.params;

  try {
    const specialist = await Specialist.findById(specialistId).select(
      '-password' 
    );

    if (!specialist) {
      return res
        .status(404)
        .json({ success: false, message: 'Specialist not found' });
    }

    res.status(200).json({ success: true, data: specialist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    let user;

    user =
      (await Specialist.findById(userId, "-password")) ||
      (await Patient.findById(userId, "-password"));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
