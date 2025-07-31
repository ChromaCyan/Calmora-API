const express = require('express');
const router = express.Router();
const geminiController = require('../controller/geminiController');

router.post('/ask-ai', geminiController.askGemini); 

module.exports = router;
