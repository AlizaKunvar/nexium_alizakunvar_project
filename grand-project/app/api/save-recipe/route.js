import { connectDB } from "@/lib/mongodb";
import Recipe from "@/models/Recipe";

export async function POST(req) {
  try {
    const { user, recipe } = await req.json();

    await connectDB();
    const savedRecipe = await Recipe.create({ user, ...recipe });

    return Response.json(savedRecipe);
  } catch (error) {
    return Response.json(
      { error: "Failed to save recipe" },
      { status: 500 }
    );
  }
}
