
import { useGroceryItems } from './grocery/useGroceryItems';
import { useRecipes } from './grocery/useRecipes';
import { useGroceryFilters } from './grocery/useGroceryFilters';
import { useGroceryRecipeIntegration } from './grocery/useGroceryRecipeIntegration';

export const useGroceryList = () => {
  // Load grocery items
  const { 
    groceries: allGroceries, 
    isLoading: itemsLoading, 
    addGroceryItem,
    updateItem,
    deleteItem,
    toggleCompletion,
    toggleFrequent,
    reuseItem
  } = useGroceryItems();

  // Load recipes
  const { 
    recipes, 
    saveRecipe,
    deleteRecipe,
    isLoading: recipesLoading 
  } = useRecipes();

  // Filter and categorize groceries
  const { 
    activeCategory, 
    setActiveCategory, 
    filteredGroceries, 
    suggestedItems, 
    counts 
  } = useGroceryFilters(allGroceries);

  // Recipe-grocery integration
  const { 
    handleCompleteRecipe,
    addIngredientToRecipe
  } = useGroceryRecipeIntegration(addGroceryItem, toggleCompletion, allGroceries);

  // Determine overall loading state
  const isLoading = itemsLoading || recipesLoading;

  return {
    groceries: filteredGroceries,
    allGroceries,
    activeCategory,
    setActiveCategory,
    addGroceryItem,
    updateItem,
    deleteItem,
    toggleCompletion,
    toggleFrequent,
    reuseItem,
    suggestedItems,
    recipes,
    saveRecipe,
    deleteRecipe,
    onCompleteRecipe: handleCompleteRecipe,
    addIngredientToRecipe,
    isLoading,
    counts,
  };
};
