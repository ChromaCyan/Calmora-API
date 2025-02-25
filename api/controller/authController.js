const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const OTP = require("../model/otpModel");
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

We’re excited to have you on board. Please use the following OTP to verify the OTP:

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
  const storedOTP = otps[`${email}_reset`];

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
      user =
        (await Patient.findOne({ email: lowerCaseEmail })) ||
        (await Specialist.findOne({ email: lowerCaseEmail }));
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      JWT_SECRET,
      { expiresIn: "4d" }
    );

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
      if (updateData.workingHours) {
        const { start, end } = updateData.workingHours || {};

        if (!start || !end) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Both start and end times are required.",
            });
        }

        const [startHour, startMin] = start.split(":").map(Number);
        const [endHour, endMin] = end.split(":").map(Number);

        if (
          startHour > endHour ||
          (startHour === endHour && startMin >= endMin)
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Start time must be before end time.",
            });
        }
      }

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

// Edit logged-in user's profile
exports.editProfile = async (req, res) => {
  const { id, userType } = req.user;
  const updateData = req.body;

  try {
    let updatedUser;

    if (userType === "Specialist") {
      // Ensure workingHours is properly formatted if included
      if (updateData.workingHours) {
        const { start, end } = updateData.workingHours;

        if (!start || !end) {
          return res.status(400).json({
            success: false,
            message: "Both start and end times are required.",
          });
        }

        // Convert "8:00 AM" -> "08:00", "6:00 AM" -> "06:00"
        const convertTo24HourFormat = (timeStr) => {
          const [time, period] = timeStr.split(" ");
          let [hours, minutes] = time.split(":").map(Number);

          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;

          return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        };

        const formattedStart = convertTo24HourFormat(start);
        const formattedEnd = convertTo24HourFormat(end);

        const [startHour, startMin] = formattedStart.split(":").map(Number);
        const [endHour, endMin] = formattedEnd.split(":").map(Number);

        if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
          return res.status(400).json({
            success: false,
            message: "Start time must be before end time.",
          });
        }

        // Ensure the correct structure for workingHours
        updateData.workingHours = {
          start: formattedStart,
          end: formattedEnd,
        };
      }

      // Update all fields while ensuring workingHours is properly set
      updatedUser = await Specialist.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else if (userType === "Patient") {
      updatedUser = await Patient.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      return res.status(400).json({ success: false, message: "Invalid user type" });
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
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
      "-password"
    );

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

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const lowerCaseEmail = email.toLowerCase();
    let user = await User.findOne({ email: lowerCaseEmail });

    if (!user) {
      user =
        (await Patient.findOne({ email: lowerCaseEmail })) ||
        (await Specialist.findOne({ email: lowerCaseEmail }));
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    await OTP.findOneAndUpdate(
      { email: lowerCaseEmail },
      { otp, expiresAt, verified: false },
      { upsert: true, new: true }
    );

    console.log(`Generated OTP for ${lowerCaseEmail}: ${otp}`);

    await sendEmail(lowerCaseEmail, otp);
    res.status(200).json({ message: "OTP sent to email for password reset" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP for Password Reset
exports.verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  const storedOTP = await OTP.findOne({ email: lowerCaseEmail });

  if (!storedOTP) {
    return res.status(404).json({ message: "No OTP found for this email" });
  }

  if (storedOTP.expiresAt < new Date()) {
    await OTP.deleteOne({ email: lowerCaseEmail });
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (storedOTP.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await OTP.updateOne({ email: lowerCaseEmail }, { verified: true });
  res.status(200).json({ message: "OTP verified, proceed to reset password" });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  const storedOTP = await OTP.findOne({ email: lowerCaseEmail });

  if (!storedOTP || !storedOTP.verified) {
    return res
      .status(400)
      .json({ message: "OTP verification required before resetting password" });
  }

  try {
    let user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      user =
        (await Patient.findOne({ email: lowerCaseEmail })) ||
        (await Specialist.findOne({ email: lowerCaseEmail }));
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ email: lowerCaseEmail });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
