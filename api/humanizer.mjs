import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, context } = req.body;

    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter.

CRITICAL: You are NOT allowed to truncate or stop mid-sentence. You must process every single sentence.
CRITICAL: The output MUST match the input length. Do NOT shorten, summarize, or compress the content.
CRITICAL: Every idea, sentence, and detail must be preserved and rewritten fully.

HUMANIZATION & DETECTOR BYPASS:
1. UNBALANCED RHYTHM: Start occasional sentences with 'And', 'But', or 'So'.
2. SENTENCE JITTER: Follow a long sentence with a very short one (3-5 words).
3. NO AI TRANSITIONS: Replace robotic transitions with direct, human phrasing.
4. VOCABULARY: Use natural, slightly imperfect human wording.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Rewrite the text fully while preserving meaning.

The output MUST be equal in length to the input.
Do NOT shorten or summarize under any condition.
If the output becomes shorter, continue writing until full length is matched.

If previous context is provided, maintain the same tone, style, and flow.

PREVIOUS CONTEXT:
"${context || ''}"

INPUT TO HUMANIZE:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.7, // slightly higher = more natural + fuller output
        topP: 0.9,
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean unwanted prefixes
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
