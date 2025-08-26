const { GoogleGenerativeAI } = require("@google/generative-ai");

// This fucking part is broken so ill prolly temporarily
// leave the API Key here while i look for fix since it can't read the .env file for some reason on this controller alone.

//const dotenv = require("dotenv");
//dotenv.config();
//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI("AIzaSyCIXMpsEUZBeIuuB_Pl2dDJozJlHzuk7nk");
const ELEVEN_API_KEY = "sk_2572e75dbc19d24229abb11e6d9a30ffb38cfa0147d5f296";

exports.askGemini = async (req, res) => {
  const { message, withVoice } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // --- Gemini ---
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
Do not go out of topic outside of mental health, always keep them in topic about their mental wellbeing and what they feel. Limit all responses to 250–500 characters. If your response exceeds this, shorten it while keeping meaning.`,
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

    const reply = result.response.text();

    let audioBase64 = null;

    // --- ElevenLabs TTS ---
    if (withVoice) {
      const voiceId = "pNInz6obpgDQGcFmaJgB";
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      const audioResponse = await fetch(elevenUrl, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.7,
          },
        }),
      });

      // stream raw MP3
      const audioBuffer = await audioResponse.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString("base64");
    }

    // text-only case
    res.json({ reply, audio: audioBase64 });
  } catch (err) {
    console.error("Gemini/ElevenLabs Error:", err.message);
    res.status(500).json({ error: "AI Error: Unable to respond right now." });
  }
};
