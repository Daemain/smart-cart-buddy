
import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';

interface SuggestedItemsProps {
  items: GroceryItemType[];
  reuseItem: (item: GroceryItemType) => void;
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({ items, reuseItem }) => {
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
        {items.map(item => (
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
  );
};

export default SuggestedItems;
