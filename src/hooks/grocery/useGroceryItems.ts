
import { useState, useEffect, useMemo } from 'react';
import { GroceryItem, GroceryList, GroceryCategory } from '@/types/grocery';
import { 
  loadGroceries, 
  addGroceryItem as addItem,
  updateGroceryItem,
  deleteGroceryItem,
  toggleItemCompletion, 
  toggleItemFrequent,
} from '@/services/groceryService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useGroceryItems = () => {
  const [groceries, setGroceries] = useState<GroceryList>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchGroceries = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const items = await loadGroceries();
          setGroceries(items);
        } catch (error) {
          console.error('Error fetching groceries:', error);
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
        setIsLoading(false);
      }
    };
    
    fetchGroceries();
  }, [user]);
  
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
    groceries,
    setGroceries,
    isLoading,
    addGroceryItem,
    updateItem,
    deleteItem,
    toggleCompletion,
    toggleFrequent,
    reuseItem
  };
};
