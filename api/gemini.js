const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { style, grammar, tone, sentence } = req.body;

  if (!sentence) {
    res.status(400).json({ error: "Sentence is required" });
    return;
  }

  const finalPrompt = `You are a fictional language generator or a colang generator.
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
    res.status(200).json({ success: true, text: generatedText });

  } catch (error) {
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
};