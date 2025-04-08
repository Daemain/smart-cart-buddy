
import { Recipe } from '@/types/grocery';
import { toast } from '@/components/ui/use-toast';

export const useGroceryRecipeIntegration = (
  addGroceryItem: (name: string, quantity: string, notes?: string, recipeId?: string) => Promise<void>,
  toggleCompletion: (id: string) => Promise<void>,
  allGroceries: any[]
) => {
  const handleCompleteRecipe = (recipe: Recipe) => {
    // Mark all ingredients from this recipe as completed
    const recipeItems = allGroceries.filter(
      item => item.recipeId === recipe.id && !item.isCompleted
    );
    
    if (recipeItems.length === 0) {
      toast({
        title: "No items to complete",
        description: `No incomplete ingredients found for "${recipe.title}".`,
      });
      return;
    }
    
    recipeItems.forEach(item => {
      toggleCompletion(item.id);
    });
    
    toast({
      title: "Recipe completed",
      description: `"${recipe.title}" has been marked as completed.`,
    });
  };

  const addIngredientToRecipe = async (recipe: Recipe, ingredientName: string, quantity: string) => {
    if (!ingredientName.trim()) {
      toast({
        title: "Error",
        description: "Ingredient name is required",
        variant: "destructive"
      });
      return Promise.reject(new Error("Ingredient name is required"));
    }

    // Call the addGroceryItem function with recipe ID to associate it
    try {
      await addGroceryItem(ingredientName, quantity, undefined, recipe.id);
      
      toast({
        title: "Ingredient added",
        description: `Added "${ingredientName}" to "${recipe.title}"`,
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding ingredient:", error);
      
      toast({
        title: "Failed to add ingredient",
        description: "There was an error adding the ingredient to the recipe.",
        variant: "destructive"
      });
      
      throw error;
    }
  };

  return {
    handleCompleteRecipe,
    addIngredientToRecipe
  };
};
