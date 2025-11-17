# **Calmora API – Backend Documentation**

![Calmora Logo](images/calmora_circle_crop.png)

---

A backend API powering **Calmora**, a mental health support platform designed for **Filipinos aged 16+**.  
Built with **Node.js**, **Express**, **MongoDB**, and integrates AI-powered chatbot features (Gemini).

This README documents all **routes**, **setup steps**, and **system architecture**.

---

## 📌 Table of Contents
1. [Overview]
2. [Tech Stack]
3. [Project Structure]
4. [Installation & Setup]
5. [Environment Variables]
6. [Authentication]
7. [API Routes]
8. [Running the Server]

---

## 🎯 Overview

Calmora API handles:

- User & specialist authentication  
- Appointment booking system  
- Specialist availability management  
- Mental health articles  
- Survey and recommendation system  
- AI chatbot (Gemini-based)  
- Admin approvals  

---

## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Backend Framework | **Node.js + Express** |
| Database | **MongoDB / Mongoose / Supabase**  |
| Real-time | **Socket.IO** |
| AI Integration | **Google Gemini API** |
| Auth | **JWT** |
| Deployment | Vercel, Render, or Own server |

---

## 📁 Project Structure (API)

```
/controller
/middlware
/model
/routes
/socket
/utils
server.js
.env
```

---

## 🔧 Installation & Setup

### 1. Clone the repository
```sh
git clone https://github.com/<your-repo>/calmora-api.git
cd calmora-api
```

### 2. Install dependencies
```sh
npm install
```

### 3. Create `.env`
```
PORT=3000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
EMAIL=google@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## 🔐 Authentication

Use JWT bearer tokens:

```
Authorization: Bearer <token>
```

Role middlewares available:
- `isAdmin`
- `isSpecialist`
- `isPatient`
- `isSpecialistOrPatient`

---

# 📡 API Routes

## **1. Admin Routes** — `/api/admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/specialists` | Get all specialists |
| POST | `/specialists/:id/approve` | Approve specialist |
| POST | `/specialists/:id/reject` | Reject specialist |

---

## **2. Auth / User Routes** — `/api/auth`

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login |
| POST | `/send-verification-otp` | Send OTP |
| POST | `/verify-otp` | Verify OTP |
| POST | `/forgot-password` | Request reset OTP |
| POST | `/verify-reset-otp` | Verify reset OTP |
| POST | `/reset-password` | Reset password |

### Protected
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| GET | `/specialists` | Browse specialists |
| GET | `/patient-data` | Patient-only data |

---

## **3. Appointment Routes** — `/api/appointment`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/patient/:id` | Patient | Get appointments |
| GET | `/specialist/:id` | Specialist | Get appointments |
| PUT | `/:id/accept` | Specialist | Accept |
| PUT | `/:id/decline` | Specialist | Decline |
| POST | `/:id/complete` | Specialist | Complete |
| PUT | `/:id/cancel` | Both | Cancel |
| PUT | `/:id/reschedule` | Both | Reschedule |

---

## **4. Article Routes** — `/api/article`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-article` | Create article |
| PUT | `/:id` | Update |
| GET | `/articles` | Get all |
| GET | `/specialist/:id` | Get by specialist |
| GET | `/:id` | Get article |
| DELETE | `/:id` | Delete |

---

## **5. Survey Routes** — `/api/survey`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create survey |
| POST | `/submit` | Submit |
| GET | `/all` | All surveys |
| GET | `/results/:patientId` | Latest result |
| GET | `/:id/recommended-articles` | Recommended articles |

---

## **6. Timeslot Routes** — `/api/timeslot`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:specialistId/all` | All slots |
| GET | `/:specialistId/:date` | Slots for date |
| POST | `/` | Create |
| PUT | `/:slotId` | Update |
| DELETE | `/:slotId` | Delete |
| POST | `/book` | Book slot |

---

## **7. AI Chatbot Routes** — `/api/chatbot`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ask-ai` | Ask Gemini |
| GET | `/fetch-audio` | Fetch TTS audio |
| GET | `/chat-history/:userId` | User logs |

---

## ▶ Running the Server

### Navigate to API folder:
```sh
cd api
```

### Development:
```sh
npm run dev
```

### Production:
```sh
npm start
```

