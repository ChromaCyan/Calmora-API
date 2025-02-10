const Article = require('../model/articlesModel');
const Specialist = require('../model/userModel');

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
