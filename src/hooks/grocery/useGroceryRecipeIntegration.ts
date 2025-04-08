
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
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient && typeof ingredient.name === 'string' && ingredient.name.trim()) {
        addGroceryItem(
          ingredient.name, 
          typeof ingredient.quantity === 'string' ? ingredient.quantity : '', 
          undefined, 
          recipe.id
        );
      }
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
