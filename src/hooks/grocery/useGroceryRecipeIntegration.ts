
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

  const handleAddToList = async (recipe: Recipe) => {
    // Check if ingredients from this recipe already exist in the grocery list
    const existingIngredients = allGroceries.filter(
      item => item.recipeId === recipe.id
    );
    
    // Filter out the ingredients that already exist in the list
    const newIngredients = recipe.ingredients.filter(ingredient => 
      !existingIngredients.some(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      )
    );
    
    if (newIngredients.length === 0) {
      toast({
        title: "No new ingredients",
        description: `All ingredients from "${recipe.title}" are already in your list.`,
      });
      return;
    }
    
    // Add the new ingredients to the grocery list
    for (const ingredient of newIngredients) {
      await addGroceryItem(
        ingredient.name,
        ingredient.quantity || '',
        '',  // No notes
        recipe.id  // Associate with the recipe
      );
    }
    
    toast({
      title: "Ingredients added",
      description: `Added ${newIngredients.length} ingredients from "${recipe.title}" to your list.`,
    });
  };

  return {
    handleCompleteRecipe,
    handleAddToList
  };
};
