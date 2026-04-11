import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using the current 2026 flagship: gemini-3-flash-preview
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a clinical auditor and expert human ghostwriter. 
      
      STRICT CONSTRAINTS:
      1. LENGTH: Your output must be within +/- 10% of the original word count. Do not expand or elaborate.
      2. DETECTOR BYPASS: Use 'Burstiness' (varying sentence rhythm) and 'Perplexity' (uncommon synonyms).
      3. TEXTURE: Use em-dashes (—) and semicolons. Avoid all AI transitions like 'Furthermore' or 'In conclusion'.
      4. STYLE: Write with a gritty, analytical, and slightly skeptical human tone.
      
      Output ONLY the rewritten text.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RE-ENGINEER THIS TEXT. Maintain original meaning and length. Do not summarize and do not expand. 
          
          ORIGINAL TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.22, // Lowered from 1.32 to prevent excessive wordiness
        topP: 0.85,        // Tightened to keep the AI focused on the input's scope
        maxOutputTokens: 2500,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const response = await result.response;
    let output = response.text().trim();

    // Remove any accidental AI conversational markers
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    console.error("API ERROR:", error.message);
    return res.status(500).json({ error: "Engine synchronization error. Please try again." });
  }
}
