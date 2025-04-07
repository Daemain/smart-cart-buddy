
import { GroceryItem, GroceryList, Recipe } from '@/types/grocery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Load groceries from Supabase
export const loadGroceries = async (): Promise<GroceryList> => {
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform from Supabase format to our app format
    return data.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity || '',
      notes: item.notes || undefined,
      isCompleted: item.is_completed || false,
      isFrequent: item.is_frequent || false,
      createdAt: new Date(item.created_at).getTime(),
      recipeId: item.recipe_id || undefined
    }));
  } catch (error) {
    console.error('Error loading groceries from Supabase:', error);
    // Fallback to localStorage if Supabase fails
    const savedItems = localStorage.getItem('smart-cart-buddy-items');
    return savedItems ? JSON.parse(savedItems) : [];
  }
};

// Add a new grocery item to Supabase
export const addGroceryItem = async (item: Omit<GroceryItem, 'id' | 'createdAt'>): Promise<GroceryItem> => {
  try {
    // Create a new item with temporary ID until we get the one from Supabase
    const tempItem: GroceryItem = {
      ...item,
      id: `temp-${Date.now()}`,
      createdAt: Date.now(),
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        is_completed: item.isCompleted,
        is_frequent: item.isFrequent,
        recipe_id: item.recipeId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Return the item with the ID from Supabase
    return {
      id: data.id,
      name: data.name,
      quantity: data.quantity || '',
      notes: data.notes || undefined,
      isCompleted: data.is_completed || false,
      isFrequent: data.is_frequent || false,
      createdAt: new Date(data.created_at).getTime(),
      recipeId: data.recipe_id || undefined
    };
  } catch (error) {
    console.error('Error adding grocery item to Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const newItem: GroceryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    
    const updatedItems = [newItem, ...currentItems];
    localStorage.setItem('smart-cart-buddy-items', JSON.stringify(updatedItems));
    
    return newItem;
  }
};

// Update an existing grocery item
export const updateGroceryItem = async (updatedItem: GroceryItem): Promise<GroceryList> => {
  try {
    const { error } = await supabase
      .from('grocery_items')
      .update({
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        notes: updatedItem.notes,
        is_completed: updatedItem.isCompleted,
        is_frequent: updatedItem.isFrequent,
        recipe_id: updatedItem.recipeId
      })
      .eq('id', updatedItem.id);
    
    if (error) throw error;
    
    return loadGroceries(); // Reload the list to get the latest data
  } catch (error) {
    console.error('Error updating grocery item in Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const updatedItems = currentItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    localStorage.setItem('smart-cart-buddy-items', JSON.stringify(updatedItems));
    
    return updatedItems;
  }
};

// Delete a grocery item
export const deleteGroceryItem = async (id: string): Promise<GroceryList> => {
  try {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return loadGroceries(); // Reload the list to get the latest data
  } catch (error) {
    console.error('Error deleting grocery item from Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const updatedItems = currentItems.filter(item => item.id !== id);
    localStorage.setItem('smart-cart-buddy-items', JSON.stringify(updatedItems));
    
    return updatedItems;
  }
};

// Toggle item completion status
export const toggleItemCompletion = async (id: string): Promise<GroceryList> => {
  try {
    // First get the current item to know its current completion status
    const { data: currentItem, error: fetchError } = await supabase
      .from('grocery_items')
      .select('is_completed')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Toggle the completion status
    const { error } = await supabase
      .from('grocery_items')
      .update({ is_completed: !currentItem.is_completed })
      .eq('id', id);
    
    if (error) throw error;
    
    return loadGroceries(); // Reload the list to get the latest data
  } catch (error) {
    console.error('Error toggling item completion in Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const updatedItems = currentItems.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    localStorage.setItem('smart-cart-buddy-items', JSON.stringify(updatedItems));
    
    return updatedItems;
  }
};

// Toggle item frequent status
export const toggleItemFrequent = async (id: string): Promise<GroceryList> => {
  try {
    // First get the current item to know its current frequent status
    const { data: currentItem, error: fetchError } = await supabase
      .from('grocery_items')
      .select('is_frequent')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Toggle the frequent status
    const { error } = await supabase
      .from('grocery_items')
      .update({ is_frequent: !currentItem.is_frequent })
      .eq('id', id);
    
    if (error) throw error;
    
    return loadGroceries(); // Reload the list to get the latest data
  } catch (error) {
    console.error('Error toggling item frequent status in Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const updatedItems = currentItems.map(item => 
      item.id === id ? { ...item, isFrequent: !item.isFrequent } : item
    );
    localStorage.setItem('smart-cart-buddy-items', JSON.stringify(updatedItems));
    
    return updatedItems;
  }
};

// Load recipes from Supabase
export const loadRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      createdAt: new Date(recipe.created_at).getTime()
    }));
  } catch (error) {
    console.error('Failed to load recipes from Supabase', error);
    // Fallback to localStorage
    const savedRecipes = localStorage.getItem('recipes');
    return savedRecipes ? JSON.parse(savedRecipes) : [];
  }
};

// Save recipe to Supabase
export const saveRecipe = async (recipes: Recipe[]): Promise<void> => {
  const latestRecipe = recipes[recipes.length - 1];
  
  try {
    // Only save the most recently added recipe
    if (latestRecipe) {
      const { error } = await supabase
        .from('recipes')
        .insert({
          title: latestRecipe.title,
          ingredients: latestRecipe.ingredients,
          instructions: latestRecipe.instructions || null
        });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Failed to save recipe to Supabase', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('recipes', JSON.stringify(recipes));
    } catch (localError) {
      console.error('Failed to save recipes to localStorage', localError);
    }
  }
};
