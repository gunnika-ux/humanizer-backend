import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // RESTORED your original model
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: Match the input length. If the input is 50 words, the output must be approximately 50 words. 
      Do NOT add extra paragraphs or filler content.

      HUMANIZATION & DETECTOR BYPASS:
      1. UNBALANCED RHYTHM: Start occasional sentences with 'And', 'But', or 'So'. 
      2. SENTENCE JITTER: Follow a long, winding sentence with a very short, sharp one (3-5 words).
      3. HUMAN FRICTION: Use conversational asides—like 'frankly,' or 'the reality is'. 
      4. NO AI TRANSITIONS: Replace 'Furthermore' or 'Moreover' with gritty, direct links.
      5. VOCABULARY: Use technical but "messy" human terms (e.g., instead of 'foster,' use 'kickstart').`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Humanize this text. Keep the output length nearly identical to the input.
          
          INPUT TO HUMANIZE: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, // Adjusted slightly to keep it tight but unpredictable
        topP: 0.98,
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite|Humanized Text):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error", details: error.message });
  }
}
