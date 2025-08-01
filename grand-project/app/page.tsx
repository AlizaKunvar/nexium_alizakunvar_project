"use client";

import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setSavedRecipes([]);
    setRecipe(null);
    alert("Signed out successfully!");
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

      const responseText = await response.text();
      if (!responseText) throw new Error("Server returned an empty response");

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          title: "Generated Recipe",
          steps: [responseText],
          prep_time: "N/A",
          servings: 1,
        };
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Server error");
      }

      const formattedRecipe: Recipe = {
        title: data?.title || "Untitled Recipe",
        prep_time: data?.prep_time || "Not specified",
        servings: Number(data?.servings) || 1,
        steps: Array.isArray(data?.steps)
          ? data.steps
          : typeof data?.instructions === "string"
          ? [data.instructions]
          : ["No instructions provided"],
      };

      setRecipe(formattedRecipe);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate recipe";
      setError(errorMessage);
      setRecipe({
        title: "Recipe Generation Failed",
        prep_time: "N/A",
        servings: 0,
        steps: [errorMessage],
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
      alert(err instanceof Error ? err.message : "Failed to save recipe");
    }
  }

  async function getSavedRecipes() {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`/api/get-recipes?user=${session.user.email}`);
      if (!response.ok) throw new Error("Failed to fetch saved recipes");

      const data: Recipe[] = await response.json();
      setSavedRecipes(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center py-12 px-6 text-white"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className="max-w-3xl mx-auto bg-black/70 shadow-2xl backdrop-blur-lg rounded-3xl p-10 border border-purple-100">
        <h1 className="text-4xl font-extrabold text-center mb-8 drop-shadow-lg">
          🍽️ AI Recipe Generator
        </h1>

        {!session ? (
          <button
            onClick={signIn}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-5 rounded-xl w-full text-lg font-semibold shadow-md transition-all"
          >
            🔐 Login with Magic Link
          </button>
        ) : (
          <div className="mb-6 text-center">
            <p className="font-medium drop-shadow-md mb-2">
              Logged in as: {session.user.email}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={getSavedRecipes}
                className="bg-gray-900 hover:bg-gray-800 text-white py-3 px-5 rounded-xl w-full font-semibold shadow transition"
              >
                📁 View Saved Recipes
              </button>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-5 rounded-xl w-full font-semibold shadow transition"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="🍅 Ingredients (e.g. chicken, rice)"
            className="border-2 border-gray-500 bg-white/10 placeholder-white text-white rounded-xl p-3 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          <input
            type="text"
            placeholder="🥦 Diet Preference (e.g. vegan)"
            className="border-2 border-gray-500 bg-white/10 placeholder-white text-white rounded-xl p-3 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
          />
          <button
            onClick={generateRecipe}
            disabled={loading}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl w-full font-semibold shadow transition-all ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "⏳ Generating..." : "✨ Generate Recipe"}
          </button>
          {error && <p className="text-red-400 font-medium">{error}</p>}
        </div>

        {recipe && (
          <div className="mt-10 bg-white/10 border border-purple-400 rounded-2xl p-6 shadow-md transition-all">
            <h2 className="text-2xl font-bold text-white mb-3">{recipe.title}</h2>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-200">
              <p><strong>Prep Time:</strong> {recipe.prep_time}</p>
              <p><strong>Servings:</strong> {recipe.servings}</p>
            </div>
            <h3 className="text-lg font-semibold mb-2">📋 Instructions</h3>
            <ol className="list-decimal ml-6 space-y-2 text-white">
              {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            {session && (
              <button
                onClick={saveRecipe}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-xl w-full font-semibold shadow transition"
              >
                💾 Save Recipe
              </button>
            )}
          </div>
        )}

        {savedRecipes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow">
              📚 Your Saved Recipes
            </h2>
            <div className="space-y-4">
              {savedRecipes.map((r, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-gray-400 rounded-xl p-4 shadow hover:shadow-lg transition text-white"
                >
                  <h3 className="font-bold text-lg">{r.title}</h3>
                  <p className="text-sm">
                    {r.prep_time} • {r.servings} serving{r.servings !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setRecipe(r)}
                    className="text-blue-300 text-sm mt-1 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
