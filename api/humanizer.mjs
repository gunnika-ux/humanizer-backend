import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const inputWords = text.split(/\s+/).length;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity human editor. 
      
      DETECTOR BYPASS RULES:
      1. BURSTINESS: Mix 25-word complex sentences with 4-word punchy ones.
      2. NO TRANSITIONS: Ban 'Moreover', 'Furthermore', 'Additionally'. Use direct connections.
      3. VOCABULARY: Use specific verbs. Swap 'utilize' for 'use', 'foster' for 'build', 'comprehensive' for 'full'.
      4. STARTING WORDS: Never start consecutive sentences with the same word.
      5. NO SUMMARIZING: Match input length exactly.`
    });

    const generate = async (stylePrompt, temp) => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `${stylePrompt}: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: temp, // Varying temp between calls breaks the pattern
          topP: 0.9,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    // 🔹 Generate two distinct styles
    // Call 1: Professional but jagged
    let output1 = await generate("Rewrite this as a direct expert, avoid flowery AI language", 0.82);
    // Call 2: Narrative and descriptive
    let output2 = await generate("Rewrite this with varied sentence structures and high perplexity", 0.78);

    // 🔹 Selection Logic: Pick the one that deviates most from "AI-smoothness"
    // Usually, the one with more punctuation (commas/dashes) is more human.
    const getPunctuationCount = (str) => (str.match(/[,;:\-—]/g) || []).length;
    
    let finalOutput = 
      getPunctuationCount(output1) > getPunctuationCount(output2) ? output1 : output2;

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite|Natural Rewrite):/gi,
      ""
    );

    // Final safety check for length
    if (finalOutput.split(/\s+/).length < inputWords * 0.7) {
        finalOutput = output1.length > output2.length ? output1 : output2;
    }

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
