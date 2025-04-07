
import { GroceryItem, GroceryList, Recipe } from '@/types/grocery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';

// Load groceries from Supabase
export const loadGroceries = async (): Promise<GroceryList> => {
  try {
    // First, try to get the default list for the user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get or create a default grocery list for the user
    const { data: lists, error: listError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    let listId;
    
    if (listError || lists.length === 0) {
      // Create a default list if none exists
      const { data: newList, error: createError } = await supabase
        .from('grocery_lists')
        .insert({
          name: 'My Grocery List',
          user_id: userData.user.id
        })
        .select()
        .single();
        
      if (createError) throw createError;
      listId = newList.id;
    } else {
      listId = lists[0].id;
    }
    
    // Now get the grocery items for this list
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', listId)
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
      completedAt: item.completed_at ? new Date(item.completed_at).getTime() : undefined,
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
    // Get user and list ID
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get the default list ID
    const { data: lists, error: listError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (listError || lists.length === 0) throw new Error('No grocery list found');
    const listId = lists[0].id;
    
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
        recipe_id: item.recipeId,
        list_id: listId // This was missing in the previous version
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
      completedAt: undefined, // Initialize as undefined for new items
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
        recipe_id: updatedItem.recipeId,
        completed_at: updatedItem.completedAt ? new Date(updatedItem.completedAt).toISOString() : null
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
    
    // Calculate the completed_at timestamp if we're completing the item
    const completedAt = !currentItem.is_completed ? new Date().toISOString() : null;
    
    // Toggle the completion status
    const { error } = await supabase
      .from('grocery_items')
      .update({ 
        is_completed: !currentItem.is_completed,
        completed_at: completedAt
      })
      .eq('id', id);
    
    if (error) throw error;
    
    return loadGroceries(); // Reload the list to get the latest data
  } catch (error) {
    console.error('Error toggling item completion in Supabase:', error);
    
    // Fallback to localStorage
    const currentItems = await loadGroceries();
    const now = Date.now();
    
    const updatedItems = currentItems.map(item => {
      if (item.id === id) {
        const newCompletionState = !item.isCompleted;
        return { 
          ...item, 
          isCompleted: newCompletionState,
          // Only add completedAt if the item is being completed (not if it's being uncompleted)
          completedAt: newCompletionState ? now : undefined
        };
      }
      return item;
    });
    
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
    // Get user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the JSON data to match our Recipe type
    return data.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients 
        : JSON.parse(typeof recipe.ingredients === 'string' ? recipe.ingredients : JSON.stringify(recipe.ingredients)),
      instructions: recipe.instructions ? (
        Array.isArray(recipe.instructions) 
          ? recipe.instructions 
          : JSON.parse(typeof recipe.instructions === 'string' ? recipe.instructions : JSON.stringify(recipe.instructions))
      ) : undefined,
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
export const saveRecipe = async (title: string, ingredients: { name: string; quantity: string }[]): Promise<Recipe> => {
  try {
    // Get user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Create a recipe object to insert
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: title,
        ingredients: ingredients as unknown as Json,
        instructions: null,
        user_id: userData.user.id  // This was missing in the previous version
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform to our app format
    const newRecipe: Recipe = {
      id: data.id,
      title: data.title,
      ingredients: Array.isArray(data.ingredients) 
        ? data.ingredients 
        : JSON.parse(typeof data.ingredients === 'string' ? data.ingredients : JSON.stringify(data.ingredients)),
      createdAt: new Date(data.created_at).getTime()
    };
    
    return newRecipe;
  } catch (error) {
    console.error('Failed to save recipe to Supabase', error);
    
    // Fallback to localStorage
    const savedRecipes = localStorage.getItem('recipes');
    const recipes: Recipe[] = savedRecipes ? JSON.parse(savedRecipes) : [];
    
    // Create a new recipe with temporary ID
    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      ingredients: ingredients,
      createdAt: Date.now(),
    };
    
    // Add to local storage
    const updatedRecipes = [...recipes, newRecipe];
    localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
    
    return newRecipe;
  }
};
