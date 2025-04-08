
import { useState, useMemo } from 'react';
import { GroceryList, GroceryCategory, GroceryCounts } from '@/types/grocery';

export const useGroceryFilters = (groceries: GroceryList) => {
  const [activeCategory, setActiveCategory] = useState<GroceryCategory>('all');
  
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

  return {
    activeCategory,
    setActiveCategory,
    filteredGroceries,
    suggestedItems,
    counts: categoryCounts
  };
};
