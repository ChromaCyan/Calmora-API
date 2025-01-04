const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true},
    description: { type: String, required: true},
    timestamp: { type: date},
})