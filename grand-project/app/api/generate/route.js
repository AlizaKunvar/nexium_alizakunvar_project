export async function POST(req) {
  try {
    const { ingredients, diet } = await req.json();

    const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, diet }),
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}
