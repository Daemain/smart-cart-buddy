
import { Recipe } from '@/types/grocery';
import { toast } from '@/components/ui/use-toast';

export const useGroceryRecipeIntegration = (
  addGroceryItem: (name: string, quantity: string, notes?: string, recipeId?: string) => Promise<void>,
  toggleCompletion: (id: string) => Promise<void>,
  allGroceries: any[]
) => {
  const addRecipeToList = (recipe: Recipe) => {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      toast({
        title: "No ingredients found",
        description: "This recipe doesn't contain any ingredients to add to your grocery list.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate ingredients before adding them
    const validIngredients = recipe.ingredients.filter(ingredient => {
      return ingredient && 
             typeof ingredient === 'object' && 
             typeof ingredient.name === 'string' && 
             ingredient.name.trim() !== '';
    });
    
    if (validIngredients.length === 0) {
      toast({
        title: "Invalid ingredients format",
        description: "The recipe doesn't contain properly formatted ingredients.",
        variant: "destructive"
      });
      return;
    }
    
    // Get a normalized list of existing ingredients for easier comparison
    const existingIngredientNames = allGroceries
      .filter(item => !item.isCompleted) // Only consider uncompleted items
      .map(item => item.name.toLowerCase().trim());
    
    let addedCount = 0;
    let skippedCount = 0;
    
    validIngredients.forEach(ingredient => {
      const name = ingredient.name.trim();
      const normalizedName = name.toLowerCase();
      const quantity = typeof ingredient.quantity === 'string' ? ingredient.quantity.trim() : '';
      
      // Check if this ingredient already exists in the list (case-insensitive comparison)
      const alreadyExists = existingIngredientNames.some(existingName => 
        existingName === normalizedName
      );
      
      if (name && !alreadyExists) {
        addGroceryItem(name, quantity, undefined, recipe.id);
        addedCount++;
      } else if (name) {
        skippedCount++;
      }
    });
    
    // Create an appropriate toast message based on what happened
    if (addedCount > 0 && skippedCount > 0) {
      toast({
        title: "Recipe partially added",
        description: `Added ${addedCount} new ingredients from "${recipe.title}". Skipped ${skippedCount} ingredients already in your list.`,
      });
    } else if (addedCount > 0) {
      toast({
        title: "Recipe added to list",
        description: `${addedCount} ingredients from "${recipe.title}" have been added to your grocery list.`,
      });
    } else if (skippedCount > 0) {
      toast({
        title: "No new ingredients added",
        description: `All ingredients from "${recipe.title}" are already in your grocery list.`,
      });
    }
  };
  
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

  return {
    addRecipeToList,
    handleCompleteRecipe
  };
};
