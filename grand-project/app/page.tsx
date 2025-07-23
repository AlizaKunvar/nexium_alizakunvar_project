"use client";

import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface Recipe {
  title: string;
  prep_time: string;
  servings: number;
  steps?: string[]; // ✅ Made optional to prevent TypeScript error
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ingredients, setIngredients] = useState<string>("");
  const [diet, setDiet] = useState<string>("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    };
    getSession();
  }, []);

  async function signIn() {
    const email = prompt("Enter your email:");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email for login link");
  }

  async function generateRecipe() {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: ingredients.split(",").map((i) => i.trim()),
        diet,
      }),
    });
    const data: Recipe = await res.json();
    console.log("Generated Recipe:", data); // ✅ Debugging
    setRecipe(data);
  }

  async function saveRecipe() {
    if (!session?.user?.email) {
      alert("You need to login first");
      return;
    }
    await fetch("/api/save-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: session.user.email,
        recipe,
      }),
    });
    alert("Recipe saved!");
  }

  async function getSavedRecipes() {
    if (!session?.user?.email) return;
    const res = await fetch(`/api/get-recipes?user=${session.user.email}`);
    const data: Recipe[] = await res.json();
    setSavedRecipes(data);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">🍳 Recipe Generator</h1>

      {!session ? (
        <button
          onClick={signIn}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-4"
        >
          Login with Magic Link
        </button>
      ) : (
        <p className="mb-2 text-green-600">
          Logged in as: {session.user.email}
        </p>
      )}

      <input
        type="text"
        placeholder="Ingredients (comma separated)"
        className="border p-2 w-full rounded mb-2"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
      />
      <input
        type="text"
        placeholder="Diet (e.g., keto, vegan)"
        className="border p-2 w-full rounded mb-2"
        value={diet}
        onChange={(e) => setDiet(e.target.value)}
      />
      <button
        onClick={generateRecipe}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full mb-4"
      >
        Generate Recipe
      </button>

      {recipe && (
        <div className="border p-4 rounded bg-gray-50 mb-4">
          <h2 className="text-xl font-bold">{recipe.title || "No title"}</h2>
          <p>
            <strong>Prep Time:</strong> {recipe.prep_time || "N/A"}
          </p>
          <p>
            <strong>Servings:</strong> {recipe.servings || "N/A"}
          </p>
          <ul className="list-disc ml-4">
            {Array.isArray(recipe.steps) && recipe.steps.length > 0 ? (
              recipe.steps.map((step, i) => <li key={i}>{step}</li>)
            ) : (
              <li>No steps available</li>
            )}
          </ul>
          <button
            onClick={saveRecipe}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Save Recipe
          </button>
        </div>
      )}

      {session && (
        <div>
          <button
            onClick={getSavedRecipes}
            className="bg-gray-800 text-white px-4 py-2 rounded w-full"
          >
            View Saved Recipes
          </button>
          <div className="mt-4">
            {savedRecipes.map((r, i) => (
              <div key={i} className="border p-2 rounded mb-2">
                <h3 className="font-bold">{r.title}</h3>
                <p>
                  {r.prep_time} • {r.servings} servings
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
