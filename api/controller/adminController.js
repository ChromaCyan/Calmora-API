const Specialist = require("../model/specialistModel");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../model/userModel");
const Patient = require("../model/patientModel");
const accountApprovedEmail = require("../utils/templates/accountApproved");
const accountRejectedEmail = require("../utils/templates/accountRejected");
const accountDeletedEmail = require("../utils/templates/accountDeleted");

const JWT_SECRET = process.env.JWT_SECRET || "123_123";

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Calmora Support" <${process.env.EMAIL}>`,
    to,
    subject,
    text,
    html, 
  });
};

// Get all approved or pending specialists
exports.getAllSpecialists = async (req, res) => {
  try {
    const specialists = await Specialist.find(
      { approvalStatus: { $nin: ["pending", "rejected"] } },
      "-password"
    );
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
      return res
        .status(404)
        .json({ success: false, message: "Specialist not found" });
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
      html: accountApprovedEmail(specialist.firstName),
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
      text: `Hi ${specialist.firstName}, Unfortunately, your registration was not approved. Please contact us if you believe this is an error.`,
      html: accountRejectedEmail(specialist.firstName),
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
      html: accountDeletedEmail(specialist.firstName),
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
