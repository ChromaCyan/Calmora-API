const express = require('express');
const router = express.Router();
const articleController = require('../controller/articleController');
const { verifyToken, isPatient, isSpecialist } = require("../middleware/authMiddleware");

// Create an article
router.post('/create-article', verifyToken, articleController.createArticle);

// Edit Article
router.put('/:id', verifyToken, articleController.updateArticle);

// Get all articles
router.get('/articles', verifyToken, articleController.getAllArticles);

// Get article by specialist
router.get('/specialist/:specialistId', verifyToken, articleController.getArticlesBySpecialist);

// Get an article by ID
router.get('/:id', verifyToken, articleController.getArticleById);

// Delete an article
router.delete('/:id', verifyToken, articleController.deleteArticle);

module.exports = router;
