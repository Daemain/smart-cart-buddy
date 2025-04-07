import { GroceryItem, GroceryList, Recipe } from '@/types/grocery';

const STORAGE_KEY = 'smart-cart-buddy-items';

// Load groceries from localStorage
export const loadGroceries = (): GroceryList => {
  const savedItems = localStorage.getItem(STORAGE_KEY);
  return savedItems ? JSON.parse(savedItems) : [];
};

// Save groceries to localStorage
export const saveGroceries = (groceries: GroceryList): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groceries));
};

// Load recipes from localStorage
export const loadRecipes = (): Recipe[] => {
  try {
    const savedRecipes = localStorage.getItem('recipes');
    return savedRecipes ? JSON.parse(savedRecipes) : [];
  } catch (error) {
    console.error('Failed to load recipes from localStorage', error);
    return [];
  }
};

// Save recipes to localStorage
export const saveRecipe = (recipes: Recipe[]): void => {
  try {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  } catch (error) {
    console.error('Failed to save recipes to localStorage', error);
  }
};

// Add a new grocery item
export const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'createdAt'>): GroceryItem => {
  const newItem: GroceryItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  
  const currentItems = loadGroceries();
  const updatedItems = [newItem, ...currentItems];
  saveGroceries(updatedItems);
  
  return newItem;
};

// Update an existing grocery item
export const updateGroceryItem = (updatedItem: GroceryItem): GroceryList => {
  const currentItems = loadGroceries();
  const updatedItems = currentItems.map(item => 
    item.id === updatedItem.id ? updatedItem : item
  );
  saveGroceries(updatedItems);
  return updatedItems;
};

// Delete a grocery item
export const deleteGroceryItem = (id: string): GroceryList => {
  const currentItems = loadGroceries();
  const updatedItems = currentItems.filter(item => item.id !== id);
  saveGroceries(updatedItems);
  return updatedItems;
};

// Toggle item completion status
export const toggleItemCompletion = (id: string): GroceryList => {
  const currentItems = loadGroceries();
  const updatedItems = currentItems.map(item => 
    item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
  );
  saveGroceries(updatedItems);
  return updatedItems;
};

// Toggle item frequent status
export const toggleItemFrequent = (id: string): GroceryList => {
  const currentItems = loadGroceries();
  const updatedItems = currentItems.map(item => 
    item.id === id ? { ...item, isFrequent: !item.isFrequent } : item
  );
  saveGroceries(updatedItems);
  return updatedItems;
};
