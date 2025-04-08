
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

  const addIngredientToRecipe = (recipe: Recipe, ingredientName: string, quantity: string) => {
    if (!ingredientName.trim()) {
      toast({
        title: "Error",
        description: "Ingredient name is required",
        variant: "destructive"
      });
      return;
    }

    // Call the addGroceryItem function with recipe ID to associate it
    return addGroceryItem(ingredientName, quantity, undefined, recipe.id);
  };

  return {
    handleCompleteRecipe,
    addIngredientToRecipe
  };
};
