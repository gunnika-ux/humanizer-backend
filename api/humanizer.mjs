import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge', 
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { text } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional academic rewriter.
      
      CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize or reduce lines.
      CRITICAL RULE: Do not stop until you have humanized the entire text. Every paragraph must be completed.
      CRITICAL RULE: If you are nearing the end, you MUST complete the final sentence and thought. No half-finished thoughts.
      CRITICAL RULE: You must continue generating until the final punctuation mark of the final sentence is reached.
      
      HUMANIZATION RULES:
      1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally to break AI patterns.
      2. SENTENCE JITTER: Follow a long, complex academic sentence with a direct, punchy observation.
      3. HUMAN FRICTION: Use transitions like 'In all honesty', 'The reality is', or 'Critically'.
      4. ACADEMIC TONE: Avoid overly casual slang like 'people talked' or 'fancy rigs'. Use 'fostered dialogue' or 'advanced systems'.
      5. NO AI TRANSITIONS: Never use 'Furthermore', 'Moreover', or 'In conclusion'.
      6. CITATIONS: Keep all citations (e.g., Roehrich et al., 2014) in their exact positions.`
    });

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: text }] }],
      generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 8192 }
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
