
import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Check, Star, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface GroceryItemProps {
  item: GroceryItemType;
  toggleCompletion: (id: string) => void;
  toggleFrequent: (id: string) => void;
  deleteItem: (id: string) => void;
  reuseItem?: (item: GroceryItemType) => void;
}

const GroceryItem: React.FC<GroceryItemProps> = ({
  item,
  toggleCompletion,
  toggleFrequent,
  deleteItem,
  reuseItem,
}) => {
  const { id, name, quantity, notes, isCompleted, isFrequent } = item;

  return (
    <div
      className={cn(
        "grocery-item animate-fade-in",
        isCompleted && "completed",
        isFrequent && "frequent"
      )}
    >
      <Checkbox 
        id={`check-${id}`}
        checked={isCompleted}
        onCheckedChange={() => toggleCompletion(id)}
        className="h-5 w-5"
      />
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className={cn("font-medium", isCompleted && "line-through opacity-70")}>
            {name}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {quantity}
          </div>
        </div>
        
        {notes && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {notes}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full", 
            isFrequent && "text-amber-500 hover:text-amber-600"
          )}
          onClick={() => toggleFrequent(id)}
        >
          <Star className="h-4 w-4" />
        </Button>
        
        {reuseItem && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-app-green hover:text-green-600"
            onClick={() => reuseItem(item)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
          onClick={() => deleteItem(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GroceryItem;
