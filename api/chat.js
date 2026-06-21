export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: "MISTRAL_API_KEY not set" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    
    if (!text) {
      console.error("[Vercel] Empty response from Mistral API", { status: response.status });
      return new Response(JSON.stringify({ error: { message: "Empty response from Mistral" } }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Vercel] Error:", err.message);
    return new Response(JSON.stringify({ error: { message: err.message } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
