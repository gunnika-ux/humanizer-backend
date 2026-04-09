import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Input empty." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Structural Disruptor. Your goal is to bypass Scribbr's document-lineage check by destroying the rhythmic 'AI-fingerprint' while keeping the vocabulary that ZeroGPT and Quillbot already like."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SHATTER THE DOCUMENT LINEAGE (Target: 0% Scribbr):

          1. THE JAGGED HEARTBEAT: You must alternate sentence lengths aggressively. Sentence 1: 45+ words (complex). Sentence 2: 3-5 words (blunt). Sentence 3: Medium. AI cannot simulate this erratic rhythm.
          2. RHETORICAL ASIDES: Insert a short rhetorical question or a bracketed comment [like this] in every paragraph. Humans interrupt themselves; AI does not.
          3. LOGIC REVERSAL: Take the core conclusion of the text and put it in the first paragraph. Move the introductory hook to the middle. This breaks the 'Sequence Match' Scribbr uses.
          4. NO 'AI POINTERS': Strictly zero sentences can start with 'The', 'This', 'It', 'Moreover', or 'By'. Use Nouns or Gerunds (-ing verbs).
          5. PROTECT SUCCESSFUL DICTION: Keep the words 'quandary', 'paradigm', 'clash', and 'weighty'. They are working for ZeroGPT.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,    // Nuclear setting for maximum randomness
        topK: 100,
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Logic Error. Try again." });
  }
}
