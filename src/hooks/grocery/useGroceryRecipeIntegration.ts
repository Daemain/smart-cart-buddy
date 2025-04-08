
import { Recipe } from '@/types/grocery';
import { toast } from '@/components/ui/use-toast';

export const useGroceryRecipeIntegration = (
  addGroceryItem: (name: string, quantity: string, notes?: string, recipeId?: string) => Promise<void>,
  toggleCompletion: (id: string) => Promise<void>,
  allGroceries: any[]
) => {
  const addRecipeToList = (recipe: Recipe) => {
    recipe.ingredients.forEach(ingredient => {
      addGroceryItem(ingredient.name, ingredient.quantity, undefined, recipe.id);
    });
    
    toast({
      title: "Recipe added to list",
      description: `${recipe.ingredients.length} ingredients from "${recipe.title}" have been added to your grocery list.`,
    });
  };
  
  const handleCompleteRecipe = (recipe: Recipe) => {
    // Mark all ingredients from this recipe as completed
    const recipeItems = allGroceries.filter(
      item => item.recipeId === recipe.id && !item.isCompleted
    );
    
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
