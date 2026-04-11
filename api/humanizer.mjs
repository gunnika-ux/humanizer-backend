import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 60, 
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // CHANGED: Removed "-preview" to access the 1,500 RPD Standard Quota
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash", 
      systemInstruction: `You are a high-fidelity rewriter. Match input length exactly.
      HUMANIZATION & DETECTOR BYPASS (ZeroGPT/Scribbr Target):
      1. UNBALANCED RHYTHM: Start occasional sentences with 'And', 'But', or 'So'. 
      2. SENTENCE JITTER: Follow a long, winding sentence with a very short, sharp one.
      3. HUMAN FRICTION: Use conversational asides like 'frankly,' or 'the reality is'. 
      4. NO AI TRANSITIONS: Avoid 'Furthermore' or 'Moreover'.
      5. VOCABULARY: Use technical but "messy" human terms.`
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Mirror and humanize this exactly: "${text}"` }] }],
      generationConfig: {
        temperature: 1.35, 
        topP: 0.95,        
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim().replace(/^(Option \d+|Output|Result|Rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Engine sync error", details: error.message });
  }
}
