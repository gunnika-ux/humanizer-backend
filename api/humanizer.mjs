import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter.

CRITICAL:
- Rewrite fully while preserving meaning.
- Keep a semi-professional tone.
- Avoid perfect structure or overly polished writing.
- Do NOT summarize or remove details.

STYLE:
- Mix sentence lengths unevenly.
- Slightly vary tone between sentences.
- Avoid predictable transitions.
- Occasionally use direct phrasing.
- Keep it natural, not academic.`
    });

    let output = "";

    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite naturally and clearly.

Avoid overly polished structure.
Keep tone professional but human.

PREVIOUS CONTEXT:
"${context || ''}"

INPUT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.65,
          topP: 0.9,
          maxOutputTokens: 3000,
        }
      });

      const response = await result.response;
      output = response.text().trim();

      output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

      const inputWords = text.split(/\s+/).length;
      const outputWords = output.split(/\s+/).length;

      if (outputWords >= inputWords * 0.75) break;
    }

    // 🔥 POST-PROCESSING (KEY STEP FOR LOW AI DETECTION)
    output = addHumanVariation(output);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}

// 🔥 HUMAN VARIATION FUNCTION
function addHumanVariation(text) {
  let sentences = text.split(/(?<=[.!?])\s+/);

  return sentences.map((s, i) => {
    // Occasionally shorten sentences
    if (i % 4 === 0 && s.length > 120) {
      return s.replace(/, and /, '. ');
    }

    // Occasionally simplify phrasing
    if (i % 5 === 0) {
      s = s.replace(/In order to/g, 'To');
      s = s.replace(/It is important to note that/g, '');
    }

    // Slight randomness in tone
    if (i % 6 === 0 && s.length > 60) {
      s = s.replace(/\. /, '. ');
    }

    return s;
  }).join(' ');
}
