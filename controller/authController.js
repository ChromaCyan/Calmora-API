const Patient = require('../model/patientModel');
const Specialist = requiire('../model/specialistModel.js');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require("dotenv");

// JWT Token through env
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Where the otp will be temporary stored
const otps = {};

// Generate OTP 
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

