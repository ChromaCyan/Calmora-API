const Article = require("../model/articlesModel");
const Specialist = require("../model/userModel");
const mongoose = require("mongoose");
const User = require("../model/userModel");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Create a new article
exports.createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      heroImage,
      additionalImages,
      specialistId,
      categories,
      targetGender,
    } = req.body;

    // Check if the author (Specialist) exists
    const specialist = await Specialist.findById(specialistId);
    if (!specialist || specialist.userType !== "Specialist") {
      return res.status(404).json({ message: "Specialist not found" });
    }

    // Validate categories
    const allowedCategories = [
      "health",
      "social",
      "relationships",
      "growth",
      "coping strategies",
      "mental wellness",
      "self-care",
    ];
    if (
      !Array.isArray(categories) ||
      categories.some((cat) => !allowedCategories.includes(cat))
    ) {
      return res.status(400).json({ message: "Invalid categories provided" });
    }

    const allowedGenders = ["male", "female", "everyone"];
    if (!allowedGenders.includes(targetGender)) {
      return res
        .status(400)
        .json({ message: "Invalid target gender provided" });
    }

    console.log("Categories:", categories);

    // Create the article
    const article = new Article({
      title,
      content,
      heroImage,
      additionalImages,
      specialistId,
      categories,
      targetGender,
      status: "pending",
    });

    console.log(req.body);

    await article.save();

    const admins = await User.find({ userType: "Admin" });
    for (const admin of admins) {
      await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
        userId: admin._id,
        type: "article_pending",
        message: `A new article titled "${article.title}" has been submitted by ${specialist.firstName} ${specialist.lastName} and is pending review.`,
        extra: {
          articleId: article._id,
          specialistId: specialist._id,
        },
      });
    }

    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating article", error: error.message });
  }
};

// Get articles for a specific specialist
exports.getArticlesBySpecialist = async (req, res) => {
  try {
    const { specialistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(specialistId)) {
      return res.status(400).json({ message: "Invalid specialist ID format" });
    }

    const articles = await Article.find({
      specialistId,
      status: "approved",
    }).populate("specialistId", "firstName lastName profileImage");

    if (!articles || articles.length === 0) {
      return res
        .status(404)
        .json({ message: "No articles found for this specialist" });
    }

    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching specialist articles",
      error: error.message,
    });
  }
};

// Edit an article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      heroImage,
      additionalImages,
      specialistId,
      categories,
      targetGender,
    } = req.body;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Check if the specialist is the owner of the article
    if (specialistId && article.specialistId.toString() !== specialistId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this article" });
    }

    // Validate categories (if provided)
    const allowedCategories = [
      "health",
      "social",
      "relationships",
      "growth",
      "coping strategies",
      "mental wellness",
      "self-care",
    ];
    if (
      categories &&
      (!Array.isArray(categories) ||
        categories.some((cat) => !allowedCategories.includes(cat)))
    ) {
      return res.status(400).json({ message: "Invalid categories provided" });
    }

    const allowedGenders = ["male", "female", "everyone"];
    if (targetGender && !allowedGenders.includes(targetGender)) {
      return res.status(400).json({ message: "Invalid target gender provided" });
    }

    // Update the article fields
    article.title = title || article.title;
    article.content = content || article.content;
    article.heroImage = heroImage || article.heroImage;
    article.additionalImages = additionalImages || article.additionalImages;
    article.categories = categories || article.categories;
    article.targetGender = targetGender || article.targetGender;

    article.status = "pending";

    await article.save();

    // Notify admins
    const specialist = await Specialist.findById(article.specialistId);
    const admins = await User.find({ userType: "Admin" });
    for (const admin of admins) {
      await axios.post(`${process.env.SOCKET_SERVER_URL}/emit-notification`, {
        userId: admin._id,
        type: "article_updated_pending",
        message: `An article titled "${article.title}" by ${specialist.firstName} ${specialist.lastName} has been updated and is pending review again.`,
        extra: {
          articleId: article._id,
          specialistId: specialist._id,
        },
      });
    }

    res.status(200).json({ message: "Article updated successfully", article });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating article", error: error.message });
  }
};


// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: "approved" }).populate(
      "specialistId",
      "firstName lastName profileImage gender"
    );
    res.status(200).json(articles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching articles", error: error.message });
  }
};

// Get a single article by ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "specialistId",
      "firstName lastName profileImage"
    );
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.status(200).json(article);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching article", error: error.message });
  }
};

// Delete an article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting article", error: error.message });
  }
};
