const Specialist = require("../model/specialistModel");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../model/userModel");
const Patient = require("../model/patientModel");

const JWT_SECRET = process.env.JWT_SECRET || "123_123";
const otps = {};

// UTIL SEND EMAIL LOGIC
const sendMail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Calmora Support" <${process.env.EMAIL}>`,
    to,
    subject,
    text,
  });
};

// OTP generator
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Register User
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, gender, ...otherDetails } =
    req.body;

  try {
    const lowerCaseEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let newUser;

    // Specialist registration
    if (req.body.specialization) {
      newUser = new Specialist({
        firstName,
        lastName,
        email: lowerCaseEmail,
        password,
        gender,
        approvalStatus: "pending",
        ...otherDetails,
      });

      await newUser.save();

      // Send "under review" email
      await sendMail({
        to: lowerCaseEmail,
        subject: "Your Specialist Registration is Under Review",
        text: `Hi ${firstName},

Thank you for registering as a specialist with Calmora.
Your account is currently under review by our admin team.
You will receive another email once your account has been approved or rejected.

- Armstrong Team`,
      });

      return res.status(201).json({
        message: "Specialist registered successfully, pending admin approval",
        userId: newUser._id,
      });
    }

    // Patient registration
    newUser = new Patient({
      firstName,
      lastName,
      email: lowerCaseEmail,
      password,
      gender,
      ...otherDetails,
    });

    await newUser.save();

    // OTP verification for patients
    const otp = generateOTP();
    otps[lowerCaseEmail] = { otp, expires: Date.now() + 300000 };
    await sendMail({
      to: lowerCaseEmail,
      subject: "OTP Verification Code",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });

    const token = jwt.sign(
      { id: newUser._id, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    return res.status(201).json({
      message: "Patient created successfully, OTP sent",
      token,
      userId: newUser._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all specialists
exports.getAllSpecialists = async (req, res) => {
  try {
    const specialists = await Specialist.find({}, "-password");
    res.status(200).json({ success: true, data: specialists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending specialists
exports.getPendingSpecialists = async (req, res) => {
  try {
    const pending = await Specialist.find(
      { approvalStatus: "pending" },
      "-password"
    );
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve a specialist
exports.approveSpecialist = async (req, res) => {
  const { specialistId } = req.params;
  try {
    const specialist = await Specialist.findByIdAndUpdate(
      specialistId,
      { approvalStatus: "approved" },
      { new: true, runValidators: true }
    );

    if (!specialist) {
      return res.status(404).json({ success: false, message: "Specialist not found" });
    }

    const token = jwt.sign(
      { id: specialist._id, userType: specialist.userType },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    await sendMail({
      to: specialist.email,
      subject: "Your Specialist Account is Approved",
      text: `Hi ${specialist.firstName},

Congratulations! Your account has been approved and you can now log in to Armstrong as a licensed specialist.

- Calmora Team`,
    });

    res.status(200).json({ success: true, data: specialist, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Reject a specialist
exports.rejectSpecialist = async (req, res) => {
  const { specialistId } = req.params;
  try {
    const specialist = await Specialist.findByIdAndUpdate(
      specialistId,
      { approvalStatus: "rejected" },
      { new: true, runValidators: true }
    );

    if (!specialist) {
      return res
        .status(404)
        .json({ success: false, message: "Specialist not found" });
    }

    await sendMail({
      to: specialist.email,
      subject: "Your Specialist Account is Rejected",
      text: `Hi ${specialist.firstName},

Unfortunately, your registration as a specialist was not approved after review.
If you believe this is a mistake, please reply to this email.

- Calmora Team`,
    });

    res.status(200).json({ success: true, data: specialist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a specialist
exports.deleteSpecialist = async (req, res) => {
  const { specialistId } = req.params;

  try {
    const specialist = await Specialist.findByIdAndDelete(specialistId);

    if (!specialist) {
      return res
        .status(404)
        .json({ success: false, message: "Specialist not found" });
    }

    // Send account deletion email
    await sendMail({
      to: specialist.email,
      subject: "Your Specialist Account Has Been Deleted",
      text: `Hi ${specialist.firstName},

Your specialist account has been permanently removed from Calmora by the admin team. 
If you believe this was a mistake, please contact support.

- Calmora Team`,
    });

    res.status(200).json({
      success: true,
      message: "Specialist deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single specialist details
exports.getSpecialistById = async (req, res) => {
  const { specialistId } = req.params;

  try {
    const specialist = await Specialist.findById(specialistId, "-password");
    if (!specialist) {
      return res
        .status(404)
        .json({ success: false, message: "Specialist not found" });
    }

    res.status(200).json({ success: true, data: specialist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
