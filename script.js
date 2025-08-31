require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY environment variable is required');
  console.error('Please create a .env file with your Google AI Studio API key');
  process.exit(1);
}


const ai = new GoogleGenAI({ apiKey: API_KEY });

app.get('/', (req, res) => {
  res.json({ message: "✅ server is running!" });
});

app.post('/api/gemini', async (req, res) => {
  const { style, grammar, tone, sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "Sentence is required" });
  }

  const finalPrompt = `
You are a fictional language generator or a colang generator.
Create a sentence in an imaginary language with these settings:
- Style: ${style || "default creative style"}
- Grammar: ${grammar || "SVO"}
- Tone: ${tone || "neutral"}
- Sentence to translate: "${sentence}"
Remember: Output shouldn't be gibberish but should be different sounding unique, something people can read, you can mix different languages to create new one... etc.

Output format:
Language Name: [Name of the imaginary language you generate]

Translation: [Actual translation you generated]

Breakdown: [breakdown of translation in English - tell which English word maps to which imaginary language word]
  `;
 
  try {

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: finalPrompt
    });

    const generatedText = response.text || "⚠️ No response generated";
    res.json({ success: true, text: generatedText });

  } catch (error) {
    console.error("❌  API Error:", error.message);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌐 API endpoint: http://localhost:${PORT}/api/gemini`);
});