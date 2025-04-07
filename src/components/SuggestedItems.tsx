
import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Plus, Zap, ChefHat } from 'lucide-react';

interface SuggestedItemsProps {
  items: GroceryItemType[];
  reuseItem: (item: GroceryItemType) => void;
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({ items, reuseItem }) => {
  // Group items by recipe name if they have one
  const recipeItems = items.filter(item => item.fromRecipe);
  const regularItems = items.filter(item => !item.fromRecipe);
  
  // Group by recipe
  const recipeGroups: Record<string, GroceryItemType[]> = {};
  recipeItems.forEach(item => {
    if (item.fromRecipe) {
      if (!recipeGroups[item.fromRecipe]) {
        recipeGroups[item.fromRecipe] = [];
      }
      recipeGroups[item.fromRecipe].push(item);
    }
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 text-primary">
        <Zap className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Smart Suggestions</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {regularItems.map(item => (
          <Button
            key={item.id}
            variant="outline"
            className="flex justify-between items-center h-auto py-2 px-3"
            onClick={() => reuseItem(item)}
          >
            <span className="text-sm truncate">{item.name}</span>
            <Plus className="h-4 w-4 flex-shrink-0 ml-1" />
          </Button>
        ))}
      </div>
      
      {Object.entries(recipeGroups).length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <ChefHat className="h-4 w-4" />
            <h2 className="text-sm font-semibold">From Recipes</h2>
          </div>
          
          {Object.entries(recipeGroups).map(([recipeName, recipeItems]) => (
            <div key={recipeName} className="mb-3">
              <h3 className="text-xs font-medium mb-2">{recipeName}</h3>
              <div className="grid grid-cols-2 gap-2">
                {recipeItems.map(item => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="flex justify-between items-center h-auto py-2 px-3"
                    onClick={() => reuseItem(item)}
                  >
                    <span className="text-sm truncate">{item.name}</span>
                    <Plus className="h-4 w-4 flex-shrink-0 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestedItems;
