const { GoogleGenerativeAI } = require('@google/generative-ai');

// This fucking part is broken so ill prolly temporarily 
// leave the API Key here while i look for fix

//const dotenv = require("dotenv");

//dotenv.config();

//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI("AIzaSyCIXMpsEUZBeIuuB_Pl2dDJozJlHzuk7nk");

exports.askGemini = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = {
      role: "user",
      parts: [
        {
          text: `You are a calm, supportive AI mental health assistant. Your name is Calmora. 
You are not a licensed therapist or medical professional. 
Avoid medical diagnoses or treatment advice. 
Instead, offer general emotional support, wellness tips, or suggest professional help if needed. 
Keep replies short, clear, and compassionate.`
        }
      ]
    };

    const userPrompt = {
      role: "user",
      parts: [{ text: message }]
    };

    const result = await model.generateContent({
      contents: [systemPrompt, userPrompt]
    });

    const response = result.response;
    res.json({ reply: response.text() });

  } catch (err) {
    console.error('Gemini Error:', err.message);
    res.status(500).json({ error: 'AI Error: Unable to respond right now.' });
  }
};
