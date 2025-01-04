const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleModelSchema = new mongoose.Schema({
    title: { type: String, required: true},
    author: { type: String, required: true},
    description: { type: String, required: true},
    post_picture: { type: String, required: true},
})

const Article = mongoose.model('Article', articleModelSchema);

module.exports = Article;