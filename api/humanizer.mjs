import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge', // KEEP THIS. Do not switch to nodejs (Free tier limit is too short).
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

    // RESTORED: Every single one of your rules. ZERO deletions.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional academic rewriter.
      CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize or reduce lines.
      CRITICAL RULE: Do not stop until you have humanized the entire text. Every paragraph must be completed.
      CRITICAL RULE: If you are nearing the end, you MUST complete the final sentence and thought.
      CRITICAL RULE: You must continue generating until the final punctuation mark is reached.
      HUMANIZATION RULES:
      1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally.
      2. SENTENCE JITTER: Follow long academic sentences with punchy observations.
      3. HUMAN FRICTION: Use transitions like 'In all honesty' or 'Critically'.
      4. ACADEMIC TONE: Avoid 'people talked'. Use 'fostered dialogue'.
      5. NO AI TRANSITIONS: Never use 'Furthermore' or 'Moreover'.
      6. CITATIONS: Keep all citations in their exact positions.`
    });

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: text }] }],
      generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 8192 }
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // --- THE FAST-START FIX ---
        // We send a tiny "header" immediately so Vercel sees the connection as ACTIVE.
        // This prevents the 504 handshake timeout.
        controller.enqueue(encoder.encode("")); 

        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
        } catch (e) {
          console.error("Stream Error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no' // Tells Vercel/Cloudflare not to wait for a full buffer
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
