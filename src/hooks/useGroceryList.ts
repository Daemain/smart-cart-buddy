
import { useState, useEffect, useMemo } from 'react';
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
  const filteredGroceries = useMemo(() => {
    return groceries.filter(item => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'frequent') return item.isFrequent;
      if (activeCategory === 'completed') return item.isCompleted;
      return true;
    });
  }, [groceries, activeCategory]);
  
  // Generate suggested items based on purchase frequency
  const suggestedItems = useMemo(() => {
    // Get items that are purchased frequently but not currently in the list
    // or completed items that might need to be repurchased
    const frequentItems = groceries.filter(item => item.isFrequent);
    
    // In a real app, we would implement more sophisticated logic here
    // For now, just return some frequent items that aren't in the current list
    const nonCompletedIds = new Set(
      groceries.filter(item => !item.isCompleted).map(item => item.name.toLowerCase())
    );
    
    return frequentItems
      .filter(item => !nonCompletedIds.has(item.name.toLowerCase()))
      .slice(0, 4);
  }, [groceries]);
  
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
      
      // Show a toast when an item is marked as frequent
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
    suggestedItems,
  };
};
