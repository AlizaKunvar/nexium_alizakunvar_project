"use client";

import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface Recipe {
  title: string;
  prep_time: string;
  servings: number;
  steps: string[];
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ingredients, setIngredients] = useState("");
  const [diet, setDiet] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert("Check your email for login link");
    }
  }

  async function generateRecipe() {
    if (!ingredients.trim()) {
      setError("Please enter at least one ingredient");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients.split(",").map((i) => i.trim()),
          diet,
        }),
      });

      // First get the response as text to handle both JSON and text responses
      const responseText = await response.text();
      console.log("Raw API response:", responseText);

      // Check if response is empty
      if (!responseText) {
        throw new Error("Server returned an empty response");
      }

      // Parse the JSON or handle as text if parsing fails
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.warn("Response wasn't valid JSON, treating as text");
        data = { 
          title: "Generated Recipe",
          steps: [responseText],
          prep_time: "N/A",
          servings: 1
        };
      }

      // Handle server errors (500, etc.)
      if (!response.ok) {
        const errorMessage = data?.error || 
                           data?.message || 
                           `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Validate and transform the response with proper typing
      const formattedRecipe: Recipe = {
        title: data?.title || "Untitled Recipe",
        prep_time: data?.prep_time || "Not specified",
        servings: Number(data?.servings) || 1,
        steps: Array.isArray(data?.steps) 
              ? data.steps 
              : (typeof data?.instructions === 'string' 
                  ? [data.instructions] 
                  : ["No instructions provided"])
      };

      setRecipe(formattedRecipe);
      setError(null);
    } catch (err: unknown) {
      console.error("Recipe generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate recipe";
      setError(errorMessage);
      setRecipe({
        title: "Recipe Generation Failed",
        prep_time: "N/A",
        servings: 0,
        steps: [errorMessage]
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveRecipe() {
    if (!session?.user?.email) {
      alert("You need to login first");
      return;
    }
    if (!recipe) return;

    try {
      const response = await fetch("/api/save-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: session.user.email,
          recipe,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save recipe");
      }

      alert("Recipe saved successfully!");
      getSavedRecipes();
    } catch (err: unknown) {
      console.error("Save error:", err);
      alert(err instanceof Error ? err.message : "Failed to save recipe");
    }
  }

  async function getSavedRecipes() {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch(`/api/get-recipes?user=${session.user.email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch saved recipes");
      }
      
      const data: Recipe[] = await response.json();
      setSavedRecipes(data || []);
    } catch (err: unknown) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Recipe Generator</h1>

      {!session ? (
        <button
          onClick={signIn}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-4 hover:bg-blue-700 transition"
        >
          Login with Magic Link
        </button>
      ) : (
        <div className="mb-4">
          <p className="text-green-600 mb-2">Logged in as: {session.user.email}</p>
          <button
            onClick={getSavedRecipes}
            className="bg-gray-800 text-white px-4 py-2 rounded w-full hover:bg-gray-700 transition"
          >
            View Saved Recipes
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Ingredients (comma separated, e.g., chicken, rice, tomatoes)"
          className="border p-2 w-full rounded mb-2"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        <input
          type="text"
          placeholder="Diet (e.g., keto, vegan, vegetarian)"
          className="border p-2 w-full rounded mb-2"
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
        />
        <button
          onClick={generateRecipe}
          disabled={loading}
          className={`bg-purple-600 text-white px-4 py-2 rounded w-full mb-2 hover:bg-purple-700 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Generating..." : "Generate Recipe"}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {recipe && (
        <div className="border p-4 rounded bg-gray-50 mb-4">
          <h2 className="text-xl font-bold mb-2">{recipe.title}</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <p><span className="font-semibold">Prep Time:</span> {recipe.prep_time}</p>
            <p><span className="font-semibold">Servings:</span> {recipe.servings}</p>
          </div>
          <div className="mb-3">
            <h3 className="font-semibold mb-1">Instructions:</h3>
            <ol className="list-decimal ml-5 space-y-1">
              {recipe.steps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          {session && (
            <button
              onClick={saveRecipe}
              className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 transition"
            >
              Save Recipe
            </button>
          )}
        </div>
      )}

      {savedRecipes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Your Saved Recipes</h2>
          <div className="space-y-3">
            {savedRecipes.map((r: Recipe, i: number) => (
              <div key={i} className="border p-3 rounded bg-white shadow-sm">
                <h3 className="font-bold text-lg">{r.title}</h3>
                <p className="text-sm text-gray-600">
                  {r.prep_time} • {r.servings} serving{r.servings !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setRecipe(r)}
                  className="text-blue-600 text-sm mt-1 hover:underline"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
