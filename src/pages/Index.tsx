
import React, { useState, useEffect } from 'react';
import { useGroceryList } from '@/hooks/useGroceryList';
import GroceryItem from '@/components/GroceryItem';
import AddGroceryForm from '@/components/AddGroceryForm';
import CategoryNav from '@/components/CategoryNav';
import EmptyState from '@/components/EmptyState';
import SuggestedItems from '@/components/SuggestedItems';
import PremiumBanner from '@/components/PremiumBanner';
import RecipeExtractor from '@/components/RecipeExtractor';
import RecipeFolder from '@/components/RecipeFolder';
import { ShoppingCart, Menu } from 'lucide-react';
import { GroceryCategory, Recipe } from '@/types/grocery';

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
    suggestedItems,
    saveRecipe,
    recipes,
    addRecipeToList
  } = useGroceryList();

  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (allGroceries.length > 3 && !isPremium && !showPremiumBanner) {
      setShowPremiumBanner(true);
    }
  }, [allGroceries.length, isPremium, showPremiumBanner]);

  const counts = {
    all: allGroceries.length,
    frequent: allGroceries.filter(item => item.isFrequent).length,
    completed: allGroceries.filter(item => item.isCompleted).length,
    suggested: suggestedItems?.length || 0,
  };

  const handleRecipeExtracted = (ingredients: { name: string; quantity: string }[], recipeName: string) => {
    // Save the recipe first
    const newRecipe = saveRecipe(recipeName, ingredients);
    
    // Then add all ingredients to the grocery list with a reference to the recipe
    ingredients.forEach(ingredient => {
      addGroceryItem(ingredient.name, ingredient.quantity || '1', undefined, newRecipe.id);
    });
  };

  return (
    <div className="min-h-screen bg-app-background flex flex-col">
      <header className="sticky top-0 z-10 bg-app-background shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-1 text-primary-foreground">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold">Smart Cart Buddy</h1>
            </div>
            <div className="flex items-center gap-2">
              <AddGroceryForm addGroceryItem={addGroceryItem} />
            </div>
          </div>
          
          <CategoryNav
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            counts={counts}
            isPremium={isPremium}
          />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-3">
        {showPremiumBanner && (
          <PremiumBanner 
            onDismiss={() => setShowPremiumBanner(false)}
            onUpgrade={() => setIsPremium(true)}
          />
        )}
        
        {activeCategory === 'suggested' && (
          <>
            {isPremium ? (
              <SuggestedItems 
                items={suggestedItems || []} 
                reuseItem={reuseItem} 
              />
            ) : (
              <div className="mt-6 mb-4">
                <EmptyState 
                  category="suggested" 
                  isPremium={false} 
                  onUpgrade={() => setIsPremium(true)}
                />
              </div>
            )}
          </>
        )}
        
        {(activeCategory !== 'suggested' || isPremium) && (
          <>
            <div className="flex justify-start my-3">
              <RecipeExtractor 
                onExtractComplete={handleRecipeExtracted} 
                isPremium={isPremium} 
              />
            </div>
            
            <RecipeFolder 
              recipes={recipes}
              onAddToList={addRecipeToList}
            />
            
            <div className="space-y-2 mt-1">
              {groceries.length === 0 ? (
                <EmptyState category={activeCategory} isPremium={isPremium} />
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
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
