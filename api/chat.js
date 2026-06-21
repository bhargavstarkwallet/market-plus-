export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const system = body.system || "";

    const mistralBody = {
      model: "mistral-small-latest",
      max_tokens: 6500,
      messages: [
        { role: "user", content: system + "\n\n" + (messages[0]?.content || "") }
      ]
    };

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(mistralBody),
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
