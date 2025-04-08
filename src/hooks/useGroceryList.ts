import { useState, useEffect, useMemo } from 'react';
import { GroceryItem, GroceryList, GroceryCategory, Recipe } from '@/types/grocery';
import { 
  loadGroceries, 
  addGroceryItem as addItem,
  updateGroceryItem,
  deleteGroceryItem,
  toggleItemCompletion, 
  toggleItemFrequent,
  loadRecipes,
  saveRecipe as saveRecipeToStorage,
} from '@/services/groceryService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useGroceryList = () => {
  const [groceries, setGroceries] = useState<GroceryList>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState<GroceryCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const items = await loadGroceries();
          setGroceries(items);
          
          const savedRecipes = await loadRecipes();
          setRecipes(savedRecipes);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: "Error",
            description: "Failed to load your grocery data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setGroceries([]);
        setRecipes([]);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const filteredGroceries = useMemo(() => {
    return groceries.filter(item => {
      if (activeCategory === 'all') {
        return !item.isCompleted && !item.recipeId;
      }
      if (activeCategory === 'frequent') return item.isFrequent;
      if (activeCategory === 'completed') return item.isCompleted;
      return true;
    });
  }, [groceries, activeCategory]);
  
  const suggestedItems = useMemo(() => {
    const frequentItems = groceries.filter(item => item.isFrequent);
    
    const nonCompletedIds = new Set(
      groceries.filter(item => !item.isCompleted).map(item => item.name.toLowerCase())
    );
    
    return frequentItems
      .filter(item => !nonCompletedIds.has(item.name.toLowerCase()))
      .slice(0, 4);
  }, [groceries]);
  
  const categoryCounts = useMemo(() => {
    return {
      all: groceries.filter(item => !item.isCompleted).length,
      frequent: groceries.filter(item => item.isFrequent).length,
      completed: groceries.filter(item => item.isCompleted).length,
      suggested: suggestedItems.length,
    };
  }, [groceries, suggestedItems]);
  
  const addGroceryItem = async (name: string, quantity: string, notes?: string, recipeId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newItem = await addItem({
        name,
        quantity,
        notes,
        isCompleted: false,
        isFrequent: false,
        recipeId,
      });
      
      setGroceries(prev => [newItem, ...prev]);
      
      if (!recipeId) {
        toast({
          title: "Item added",
          description: `${name} has been added to your grocery list.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to your grocery list.",
        variant: "destructive",
      });
    }
  };
  
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
  
  const addRecipeToList = (recipe: Recipe) => {
    recipe.ingredients.forEach(ingredient => {
      addGroceryItem(ingredient.name, ingredient.quantity, undefined, recipe.id);
    });
    
    toast({
      title: "Recipe added to list",
      description: `${recipe.ingredients.length} ingredients from "${recipe.title}" have been added to your grocery list.`,
    });
  };
  
  const updateItem = async (item: GroceryItem) => {
    try {
      const updatedItems = await updateGroceryItem(item);
      setGroceries(updatedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive",
      });
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      const updatedItems = await deleteGroceryItem(id);
      setGroceries(updatedItems);
      toast({
        title: "Item deleted",
        description: "Item has been removed from your grocery list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    }
  };
  
  const toggleCompletion = async (id: string) => {
    try {
      const updatedItems = await toggleItemCompletion(id);
      setGroceries(updatedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };
  
  const toggleFrequent = async (id: string) => {
    try {
      const updatedItems = await toggleItemFrequent(id);
      setGroceries(updatedItems);
      
      const item = updatedItems.find(item => item.id === id);
      if (item?.isFrequent) {
        toast({
          title: "Added to frequent items",
          description: `${item.name} will appear in your frequent items.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };
  
  const reuseItem = async (item: GroceryItem) => {
    try {
      const newItem = await addItem({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        isCompleted: false,
        isFrequent: true,
      });
      
      setGroceries(prev => [newItem, ...prev]);
      toast({
        title: "Item added",
        description: `${item.name} has been added to your grocery list.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to your grocery list.",
        variant: "destructive",
      });
    }
  };
  
  return {
    groceries: filteredGroceries,
    allGroceries: groceries,
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
    addRecipeToList,
    isLoading,
    counts: categoryCounts,
  };
};
