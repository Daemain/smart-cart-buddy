
import { useState, useEffect } from 'react';
import { Recipe } from '@/types/grocery';
import { 
  loadRecipes,
  saveRecipe as saveRecipeToStorage,
} from '@/services/groceryService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRecipes = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const savedRecipes = await loadRecipes();
          setRecipes(savedRecipes);
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
    
    try {
      const newRecipe = await saveRecipeToStorage(title, ingredients);
      
      setRecipes(prev => [...prev, newRecipe]);
      
      toast({
        title: "Recipe saved",
        description: `"${title}" has been saved to your recipes.`,
      });
      
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

  return {
    recipes,
    saveRecipe,
    isLoading
  };
};
