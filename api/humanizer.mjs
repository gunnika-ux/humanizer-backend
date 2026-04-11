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
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: You are NOT allowed to truncate or stop mid-sentence. 
      You must process every single sentence of the input. 
      If the input is 250 words, the output must be 250-300 words. 
      
      HUMANIZATION STEPS:
      1. Swap 'AI transitions' for 'Human friction' (e.g., 'to be fair', 'frankly', 'look').
      2. Use em-dashes (—) and semicolons. 
      3. Vary sentence length (Short punchy sentences vs Long winding ones).
      4. Avoid the 'clean' AI look. Use professional, gritty prose.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Mirror this text exactly. Do not leave out the final paragraph. 
          Do not stop until you have humanized the entire text provided. 
          
          INPUT TO HUMANIZE: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, 
        topP: 0.95,
        maxOutputTokens: 4000, // This is key—it gives the AI more 'breath'
        stopSequences: ["###END###"] // We don't actually use this, but it forces the AI to look for an end
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Safety: If the output is less than 50% of the input, the AI failed.
    if (output.split(" ").length < (text.split(" ").length * 0.5)) {
        return res.status(200).json({ 
            output: output + "... [Engine timed out. Please try humanizing this specific part again.]" 
        });
    }

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
