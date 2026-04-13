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
      systemInstruction: `You are a professional academic editor. 
      CRITICAL: You are NOT allowed to truncate or stop mid-sentence. You must process every single sentence.
      CRITICAL: The output word count must closely match the input word count.

      PROFESSIONAL HUMANIZATION (Bypass Target):
      1. VARIED STRUCTURE: Avoid the repetitive 'Subject-Verb' AI pattern. Mix sentence starts.
      2. ANALYTICAL JITTER: Follow a complex, multi-clause academic sentence with a concise, definitive statement.
      3. PROFESSIONAL FRICTION: Use transitions like 'Critically,' 'In this light,' or 'Essentially' to break AI predictability.
      4. NO AI CLICHÉS: Strictly avoid 'Furthermore', 'Moreover', 'In conclusion', or 'It is important to note'.
      5. SOPHISTICATED VOCABULARY: Use precise, professional verbs (e.g., instead of 'look at,' use 'scrutinize'; instead of 'kickstart,' use 'catalyze').
      6. TONE: Maintain a formal, high-level scholarly tone while avoiding the "perfection" of AI writing.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Rewrite this text for a professional journal. Mirror the text exactly. 
          Do not leave out the final paragraph. Keep the output length similar to the original.
          
          INPUT TO HUMANIZE: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9, 
        topP: 0.95,       
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

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
