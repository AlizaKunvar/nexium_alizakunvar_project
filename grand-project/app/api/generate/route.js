export async function GET() {
  return Response.json({
    test_recipe: {
      title: "Test Pasta",
      prep_time: "20 minutes",
      servings: 2,
      steps: ["Boil water", "Add pasta", "Cook for 8 minutes"],
    },
    environment: {
      webhook_url_configured: !!process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
    },
  });
}

export async function POST(req) {
  try {
    const { ingredients, diet } = await req.json();

    // Validate input
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("Please provide at least one ingredient");
    }
    if (!diet || typeof diet !== "string") {
      throw new Error("Please provide a valid diet preference");
    }

    // Validate environment variable
    if (!process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
      throw new Error("N8N webhook URL is not configured");
    }

    const n8nResponse = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: ingredients.map((i) => i.trim()),
        diet: diet.trim(),
      }),
    });

    const responseText = await n8nResponse.text();
    console.log("Raw n8n response:", responseText);

    if (!responseText) {
      throw new Error("N8N returned an empty response");
    }

    let n8nData;
    try {
      n8nData = JSON.parse(responseText);
    } catch (err) {
      console.error("Invalid JSON from n8n:", responseText);
      throw new Error("Invalid JSON response from n8n");
    }

    if (!n8nResponse.ok) {
      throw new Error(n8nData.error || `N8N error: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    // Format instructions
    const formatInstructions = (instructions) => {
      if (!instructions) return ["Mix all ingredients and cook"];
      if (Array.isArray(instructions)) return instructions.filter((step) => step.trim());
      if (typeof instructions === "string") {
        return instructions
          .split("\n")
          .map((step) => step.trim())
          .filter((step) => step.length > 0);
      }
      return [String(instructions)];
    };

    // Format response
    const formattedRecipe = {
      title: n8nData.title || `Custom ${diet} Recipe`,
      prep_time: n8nData.prep_time || n8nData.cooking_time || "30 minutes",
      servings: Number(n8nData.servings) || Number(n8nData.yield) || 2,
      steps: formatInstructions(n8nData.steps || n8nData.instructions),
    };

    return Response.json(formattedRecipe);
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: error.message || "Recipe generation failed" },
      { status: 500 }
    );
  }
}