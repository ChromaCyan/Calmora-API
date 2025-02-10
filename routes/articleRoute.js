const express = require('express');
const router = express.Router();
const articleController = require('../controller/articleController');
const { verifyToken, isPatient, isSpecialist } = require("../middleware/authMiddleware");

// Create an article
router.post('/create-article', verifyToken, isSpecialist, articleController.createArticle);

// Get all articles
router.get('/articles', verifyToken, isSpecialist, articleController.getAllArticles);

// Get an article by ID
router.get('/article/:id', verifyToken, isSpecialist, articleController.getArticleById);

// Delete an article
router.delete('/article/:id', verifyToken, isSpecialist, articleController.deleteArticle);

module.exports = router;
