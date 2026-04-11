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
    
    // Using gemini-2.5-flash for 2026 stability
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "You are a tired, skeptical professional. Rewrite the input text using 'human friction'—meaning imperfect sentence flow, varied lengths, and specific technical jargon. DO NOT provide options. DO NOT use introductions like 'Here is a rewrite'. Output ONLY the rewritten text. Match the input word count exactly."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Humanize this. Use em-dashes. Avoid 'Furthermore' and 'In conclusion'. Keep it to roughly the same word count. Do not explain yourself. Just give me the text: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, // Higher temperature = more 'human' randomness
        topP: 0.9,
        maxOutputTokens: 1000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Final safety: Remove AI-style 'Option' headers if they sneak in
    output = output.replace(/Option \d+:|Here are a few options:|>/gi, "");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
