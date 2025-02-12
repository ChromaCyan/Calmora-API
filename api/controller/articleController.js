const Article = require('../model/articlesModel');
const Specialist = require('../model/userModel');
const mongoose = require("mongoose");

// Create a new article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, heroImage, additionalImages, specialistId } = req.body;

    // Check if the author (Specialist) exists
    const specialist = await Specialist.findById(specialistId);
    if (!specialist || specialist.userType !== 'Specialist') {
      return res.status(404).json({ message: 'Specialist not found' });
    }

    // Create the article
    const article = new Article({
      title,
      content,
      heroImage,
      additionalImages,
      specialistId: specialistId,
    });

    await article.save();
    res.status(201).json({ message: 'Article created successfully', article });
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
};

// Get articles for a specific specialist
exports.getArticlesBySpecialist = async (req, res) => {
  try {
    const { specialistId } = req.params;

    console.log("Received specialistId:", specialistId);

    console.log(mongoose.Types.ObjectId.isValid("678f00576fe57648a903c569"));
    
    if (!mongoose.Types.ObjectId.isValid(specialistId)) {
      return res.status(400).json({ message: "Invalid specialist ID format" });
    }

    console.log("Fetching articles for specialistId:", specialistId);

    const articles = await Article.find({ specialistId })
      .populate("specialistId", "firstName lastName profileImage");

    if (!articles || articles.length === 0) {
      return res.status(404).json({ message: "No articles found for this specialist" });
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Error fetching specialist articles", error: error.message });
  }
};



// Edit an article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, heroImage, additionalImages, specialistId } = req.body;

    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if the specialist is the owner of the article
    if (article.specialistId.toString() !== specialistId) {
      return res.status(403).json({ message: 'Unauthorized to edit this article' });
    }

    // Update the article fields
    article.title = title || article.title;
    article.content = content || article.content;
    article.heroImage = heroImage || article.heroImage;
    article.additionalImages = additionalImages || article.additionalImages;

    await article.save();
    res.status(200).json({ message: 'Article updated successfully', article });
  } catch (error) {
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
};


// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate('specialistId', 'firstName lastName profileImage');
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
};

// Get a single article by ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('specialistId', 'firstName lastName profileImage');
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
};

// Delete an article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await article.deleteOne();
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
};
