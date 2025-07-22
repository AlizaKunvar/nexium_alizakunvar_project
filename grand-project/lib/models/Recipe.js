import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema({
  user: { type: String, required: true },
  title: String,
  prep_time: String,
  servings: Number,
  steps: [String],
});

export default mongoose.models.Recipe || mongoose.model("Recipe", RecipeSchema);
