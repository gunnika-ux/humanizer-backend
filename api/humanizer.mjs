import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const inputWords = text.split(/\s+/).length;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are an expert technical editor. Rewrite the input text to be 100% human-passing while maintaining a high-level professional and academic tone.

STRATEGY TO BEAT ALL DETECTORS:
1. SYNTACTIC VARIATION: Combine a very complex, multi-clause sentence with a short, punchy statement immediately after. This "Burstiness" kills ZeroGPT scores.
2. PROFESSIONAL VOCABULARY: Use sophisticated terms (e.g., 'paradigm shift' instead of 'change'), but avoid AI-clichés like 'delve', 'tapestry', 'leverage', or 'foster'.
3. NO PREDICTABLE TRANSITIONS: Completely ban 'Moreover', 'Furthermore', 'In conclusion', and 'Additionally'. Connect ideas by repeating key concepts or using direct transitions like 'Beyond this,' or 'In practice,'.
4. DYNAMIC FLOW: Do not start sentences with 'The' or 'It' more than twice in a row. 
5. LENGTH: Maintain the original word count strictly. Do not summarize.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text for a professional journal. 
          Ensure the sentence structures are highly varied to pass human-authentication checks. 
          Keep the meaning and professional weight identical.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.82, // Optimized: High enough for ZeroGPT, stable enough for Scribbr
        topP: 0.88,        // Pulls back on randomness to keep it professional
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output + " ...[retry for fuller rewrite]"
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
