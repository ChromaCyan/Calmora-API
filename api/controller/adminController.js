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
const Article = require("../model/articlesModel");
const { createNotification } = require("../controller/notificationController");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

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

// Reject a specialist with a reason
exports.rejectSpecialist = async (req, res) => {
  const { specialistId } = req.params;
  const { reason } = req.body;

  try {
    const specialist = await Specialist.findByIdAndUpdate(
      specialistId,
      {
        approvalStatus: "rejected",
        rejectionReason: reason || "No reason specified",
      },
      { new: true, runValidators: true }
    );

    if (!specialist) {
      return res
        .status(404)
        .json({ success: false, message: "Specialist not found" });
    }

    const messageText = `Hi ${specialist.firstName}, unfortunately, your registration was not approved. Reason: ${
      reason || "No reason specified"
    }. Please contact us if you believe this is an error.`;

    await sendMail({
      to: specialist.email,
      subject: "Your Specialist Account was Rejected",
      text: messageText,
      html: accountRejectedEmail(specialist.firstName, reason || "No reason specified"),
    });

    res.status(200).json({
      success: true,
      message: "Specialist rejected and notified.",
      data: specialist,
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

// Get a single approved article by ID
exports.getApprovedArticleById = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await Article.findOne({
      _id: articleId,
      status: "approved",
    }).populate("specialistId", "firstName lastName profileImage");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Approved article not found",
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all pending articles
exports.getPendingArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: "pending" }).populate(
      "specialistId",
      "firstName lastName profileImage"
    );
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve an article
exports.approveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const article = await Article.findByIdAndUpdate(
      articleId,
      { status: "approved" },
      { new: true }
    );
    if (!article)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: article.specialistId,
      type: "article",
      message: `Your article "${article.title}" has been approved for publishing.`,
      extra: { articleId: article._id },
    });

    res
      .status(200)
      .json({ success: true, message: "Article approved", data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unpublish an article and notify the specialist
exports.unpublishArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;

    const article = await Article.findByIdAndUpdate(
      articleId,
      {
        status: "unpublished",
        unpublishReason: reason || "No reason specified",
      },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const message = `Your article "${article.title}" was unpublished. Reason: ${
      reason || "No reason specified"
    }`;

    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: article.specialistId,
      type: "article",
      message,
      extra: { articleId: article._id },
    });

    res.status(200).json({
      success: true,
      message: "Article unpublished and notification sent.",
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject an article with a reason
exports.rejectArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;

    const article = await Article.findByIdAndUpdate(
      articleId,
      {
        status: "rejected",
        rejectionReason: reason || "Not specified",
      },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const message = `Your article "${article.title}" was rejected. Reason: ${
      reason || "Not specified"
    }`;

    // Notify specialist
    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
      userId: article.specialistId,
      type: "article",
      message,
      extra: { articleId: article._id },
    });

    res.status(200).json({
      success: true,
      message: "Article rejected and notification sent.",
      data: article,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
