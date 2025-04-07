
import React, { useState } from 'react';
import { useGroceryList } from '@/hooks/useGroceryList';
import GroceryItem from '@/components/GroceryItem';
import AddGroceryForm from '@/components/AddGroceryForm';
import CategoryNav from '@/components/CategoryNav';
import EmptyState from '@/components/EmptyState';
import { ShoppingCart } from 'lucide-react';

const Index = () => {
  const {
    groceries,
    allGroceries,
    activeCategory,
    setActiveCategory,
    addGroceryItem,
    updateItem,
    deleteItem,
    toggleCompletion,
    toggleFrequent,
    reuseItem,
  } = useGroceryList();

  // Count items for each category
  const counts = {
    all: allGroceries.length,
    frequent: allGroceries.filter(item => item.isFrequent).length,
    completed: allGroceries.filter(item => item.isCompleted).length,
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2 text-primary-foreground">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Smart Cart Buddy</h1>
          </div>
          <AddGroceryForm addGroceryItem={addGroceryItem} />
        </div>
        
        <CategoryNav
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          counts={counts}
        />
      </header>

      <main className="space-y-2">
        {groceries.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          groceries.map(item => (
            <GroceryItem
              key={item.id}
              item={item}
              toggleCompletion={toggleCompletion}
              toggleFrequent={toggleFrequent}
              deleteItem={deleteItem}
              reuseItem={activeCategory === 'frequent' ? reuseItem : undefined}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default Index;
