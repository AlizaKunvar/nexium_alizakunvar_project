export async function POST(req) {
  try {
    const { ingredients, diet } = await req.json();

    // ✅ Ensure webhook URL exists
    if (!process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
      throw new Error("Webhook URL not found");
    }

    const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
      method: "POST", // ✅ Must be POST, not GET
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, diet }),
    });

    if (!response.ok) {
      throw new Error(`n8n Error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("✅ Recipe Response from n8n:", data); // ✅ Debugging
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Generate API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate recipe" }),
      { status: 500 }
    );
  }
}
