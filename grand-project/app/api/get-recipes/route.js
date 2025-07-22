import { connectDB } from "@/lib/mongodb";
import Recipe from "@/models/Recipe";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user");

    await connectDB();
    const recipes = await Recipe.find({ user });

    return Response.json(recipes);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
