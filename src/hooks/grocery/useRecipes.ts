
import { useState, useEffect } from 'react';
import { Recipe } from '@/types/grocery';
import { 
  loadRecipes,
  saveRecipe as saveRecipeToStorage,
  deleteRecipe as deleteRecipeFromStorage,
} from '@/services/groceryService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usageCount, setUsageCount] = useState(0);
  const { user, profile } = useAuth();
  
  // Check if user is premium
  const isPremium = profile?.is_premium || false;
  
  useEffect(() => {
    const fetchRecipes = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const savedRecipes = await loadRecipes();
          setRecipes(savedRecipes);
          
          // Load usage count from localStorage
          const storedCount = localStorage.getItem('recipeUsageCount');
          if (storedCount) {
            setUsageCount(parseInt(storedCount, 10));
          }
        } catch (error) {
          console.error('Error fetching recipes:', error);
          toast({
            title: "Error",
            description: "Failed to load your recipes.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setRecipes([]);
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
  }, [user]);
  
  const saveRecipe = async (title: string, ingredients: { name: string; quantity: string }[]): Promise<Recipe> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save recipes.",
        variant: "destructive",
      });
      throw new Error("Authentication required");
    }
    
    // Check usage limit for non-premium users
    if (!isPremium && usageCount >= 2) {
      toast({
        title: "Premium feature",
        description: "You've used your 2 free recipe saves. Upgrade to premium for unlimited recipes.",
        variant: "destructive",
      });
      throw new Error("Premium feature required");
    }
    
    try {
      const newRecipe = await saveRecipeToStorage(title, ingredients);
      
      setRecipes(prev => [...prev, newRecipe]);
      
      // Increment usage count for non-premium users
      if (!isPremium) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('recipeUsageCount', newCount.toString());
        
        if (newCount === 2) {
          toast({
            title: "Last free use",
            description: "This was your last free recipe save. Upgrade to premium for unlimited recipes.",
          });
        } else {
          toast({
            title: "Recipe saved",
            description: `"${title}" has been saved. You have ${2 - newCount} free recipe saves remaining.`,
          });
        }
      } else {
        toast({
          title: "Recipe saved",
          description: `"${title}" has been saved to your recipes.`,
        });
      }
      
      return newRecipe;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteRecipe = async (recipeId: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete recipes.",
        variant: "destructive",
      });
      throw new Error("Authentication required");
    }
    
    try {
      await deleteRecipeFromStorage(recipeId);
      
      // Update local state
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      
      toast({
        title: "Recipe deleted",
        description: "The recipe has been removed from your list.",
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipe.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    recipes,
    saveRecipe,
    deleteRecipe,
    isLoading,
    isPremium,
    usageCount
  };
};
