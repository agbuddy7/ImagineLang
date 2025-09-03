import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

let currentLanguage = null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { style, grammar, tone, sentence, continueWithLanguage, resetLanguage } = req.body;

  if (!sentence) {
    res.status(400).json({ error: "Sentence is required" });
    return;
  }

  if(resetLanguage){
    currentLanguage = null;
  }

  let finalPrompt;
  let isUsingStoredLanguage = false;

  if( continueWithLanguage && currentLanguage){


finalPrompt = `You are a translator for the fictional language "${currentLanguage.name}".

IMPORTANT: You must use ONLY the established language "${currentLanguage.name}" with these exact characteristics:
- Language Name: ${currentLanguage.name}
- Grammar Pattern: ${currentLanguage.grammarRules}
- Vocabulary Style: ${currentLanguage.vocabularyStyle}
- Previous Examples: ${currentLanguage.examples}

Translate this new sentence: "${sentence}"

You MUST follow the same language pattern, grammar rules, and vocabulary style as shown in the examples above. Do NOT create a new language - use the established one.

Output format:

Language Name: ${currentLanguage.name}

Translation: [Translation using the SAME established language]

Breakdown: [breakdown showing which English word maps to which ${currentLanguage.name} word]

(Stay consistent with the established language pattern)`;
    
isUsingStoredLanguage = true;

}else {
  finalPrompt = `You are a fictional language generator or a colang generator.
Create a sentence in an imaginary language with these settings:
- Style: ${style || "default creative style"}
- Grammar: ${grammar || "SVO"}
- Tone: ${tone || "neutral"}
- Sentence to translate: "${sentence}"
Remember: Output shouldn't be gibberish but should be different sounding unique, something people can read, you can mix different real world languages to create new one... etc.

Output format:

Language Name: [Name of the imaginary language you generate]

Translation: [Actual translation you generated]

Breakdown: [breakdown of translation in English - tell which English word maps to which imaginary language word (Dont add explanations)]

(Dont talk any thing about prompt or what was prompted)
`;
}
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt
    });

    const generatedText = response.text || "⚠️ No response generated";
    

    if (!isUsingStoredLanguage)
    {
      const languageNameMatch = generatedText.match(/Language Name:\s*(.+?)(\n|$)/);
      const translationMatch = generatedText.match(/Translation:\s*(.+?)(\n|$)/);
      const breakdownMatch = generatedText.match(/Breakdown:\s*(.+?)(\n|$)/);

      if (languageNameMatch && translationMatch) {
        currentLanguage = {
          name: languageNameMatch[1].trim(),
          grammarRules: grammar || "SVO",
          vocabularyStyle: breakdownMatch ? breakdownMatch[1].trim() : "",
          examples: `"${sentence}" = "${translationMatch[1].trim()}"`,
          originalSentence: sentence,
          originalTranslation: translationMatch[1].trim()
        };
      }
    } else if (currentLanguage) {
  
      const translationMatch = generatedText.match(/Translation:\s*(.+?)(\n|$)/);
      if (translationMatch) {
        currentLanguage.examples += `\n"${sentence}" = "${translationMatch[1].trim()}"`;
      }
    }

    res.status(200).json({
      
      success: true,
      text: generatedText,
      hasStoredLanguage: currentLanguage !== null, 
      languageName: currentLanguage ? currentLanguage.name : null,
      canContinue: !isUsingStoredLanguge && currentLanguage !== null
    });

  } catch (error) {
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
}