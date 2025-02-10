const express = require('express');
const router = express.Router();
const articleController = require('../controller/articleController');
const { verifyToken, isPatient, isSpecialist } = require("../middleware/authMiddleware");

// Create an article
router.post('/create-article', verifyToken, isSpecialist, articleController.createArticle);

// Get all articles
router.get('/articles', verifyToken, isPatient, articleController.getAllArticles);

// Get an article by ID
router.get('/:id', verifyToken, isPatient, articleController.getArticleById);

// Delete an article
router.delete('/:id', verifyToken, isSpecialist, articleController.deleteArticle);

module.exports = router;
