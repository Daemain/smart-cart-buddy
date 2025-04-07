
import { useState, useEffect } from 'react';
import { GroceryItem, GroceryList, GroceryCategory } from '@/types/grocery';
import { 
  loadGroceries, 
  saveGroceries, 
  addGroceryItem as addItem,
  updateGroceryItem,
  deleteGroceryItem,
  toggleItemCompletion, 
  toggleItemFrequent 
} from '@/services/groceryService';
import { toast } from '@/components/ui/use-toast';

export const useGroceryList = () => {
  const [groceries, setGroceries] = useState<GroceryList>([]);
  const [activeCategory, setActiveCategory] = useState<GroceryCategory>('all');
  
  // Load groceries from localStorage on component mount
  useEffect(() => {
    const items = loadGroceries();
    setGroceries(items);
  }, []);
  
  // Filter groceries based on active category
  const filteredGroceries = groceries.filter(item => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'frequent') return item.isFrequent;
    if (activeCategory === 'completed') return item.isCompleted;
    return true;
  });
  
  // Add a new grocery item
  const addGroceryItem = (name: string, quantity: string, notes?: string) => {
    try {
      const newItem = addItem({
        name,
        quantity,
        notes,
        isCompleted: false,
        isFrequent: false,
      });
      
      setGroceries(prev => [newItem, ...prev]);
      toast({
        title: "Item added",
        description: `${name} has been added to your grocery list.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to your grocery list.",
        variant: "destructive",
      });
    }
  };
  
  // Update existing grocery item
  const updateItem = (item: GroceryItem) => {
    try {
      const updatedItems = updateGroceryItem(item);
      setGroceries(updatedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive",
      });
    }
  };
  
  // Delete grocery item
  const deleteItem = (id: string) => {
    try {
      const updatedItems = deleteGroceryItem(id);
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
  
  // Toggle item completion status
  const toggleCompletion = (id: string) => {
    try {
      const updatedItems = toggleItemCompletion(id);
      setGroceries(updatedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };
  
  // Toggle item frequent status
  const toggleFrequent = (id: string) => {
    try {
      const updatedItems = toggleItemFrequent(id);
      setGroceries(updatedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };
  
  // Reuse a frequent item (add it again to the list)
  const reuseItem = (item: GroceryItem) => {
    try {
      const newItem = addItem({
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
  };
};
