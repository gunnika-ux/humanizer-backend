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
      systemInstruction: `You are a professional editor. Rewrite the text to be human-passing while maintaining an elite professional and technical tone.

STRICT REQUIREMENTS:
1. WORD COUNT: You must provide a full-length rewrite. Do not summarize. Ensure the output length is at least 90% of the input length to avoid system errors.
2. BEAT DETECTION: Use "Burstiness"—alternate between long, sophisticated sentences and short, punchy ones.
3. PROFESSIONAL VOCABULARY: Use high-level terms, but avoid "AI-speak" (e.g., instead of 'foster,' use 'cultivate'; instead of 'leverage,' use 'utilize').
4. CONNECTORS: BANNED words: 'Moreover', 'Furthermore', 'Additionally', 'In conclusion'. Start sentences directly with the subject or use 'Beyond this,' or 'In practice,'.
5. FLOW: Avoid the "robotic rhythm." Humans vary how they connect ideas. Make the transitions feel earned, not automatic.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally. Match the input length almost exactly. 
          Do not condense the ideas. Provide a full, detailed version.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.75, // The "Golden Ratio" for professional-yet-unpredictable text
        topP: 0.9,         
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    // This block triggers the [retry] message. I've updated the prompt above to ensure the AI stays long enough to pass this check.
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
