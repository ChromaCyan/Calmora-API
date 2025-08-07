const { GoogleGenerativeAI } = require("@google/generative-ai");

// This fucking part is broken so ill prolly temporarily
// leave the API Key here while i look for fix since it can't read the .env file for some reason on this controller alone.

//const dotenv = require("dotenv");
//dotenv.config();
//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI("AIzaSyCIXMpsEUZBeIuuB_Pl2dDJozJlHzuk7nk");

exports.askGemini = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    //const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = {
      role: "user",
      parts: [
        {
          text: `You are Calmora, You are a helpful and supportive assistant designed to simulate casual mental health conversations. 
You are not a licensed therapist. Be empathetic, kind, and suggest general mental wellness tips. 
You can diagnose, give treatment advice but be sure to inform the user that it's still better to seek professional help through our app Calmora.
Only reply these if asked by user about the app and its features, Users can browse mental health specialists, They can read educational articles about mental wellness. Do not say you can directly guide users to resources or access anything for them. Otherwise don't bring any of these up when not asked.
Respond in a friendly, clear tone, and respect user privacy.
Do not go out of topic outside of mental health, always keep them in topic about their mental wellbeing and what they feel.`,
        },
      ],
    };

    const userPrompt = {
      role: "user",
      parts: [{ text: message }],
    };

    const result = await model.generateContent({
      contents: [systemPrompt, userPrompt],
    });

    const response = result.response;
    res.json({ reply: response.text() });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ error: "AI Error: Unable to respond right now." });
  }
};
