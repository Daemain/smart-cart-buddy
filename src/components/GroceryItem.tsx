
import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Star, Trash2, Plus } from 'lucide-react';
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
        "grocery-item animate-fade-in rounded-lg shadow-sm border",
        isCompleted ? "bg-app-light-green border-app-light-green/80" : "bg-white border-border",
        isFrequent && !isCompleted ? "bg-app-light-blue border-app-light-blue/80" : ""
      )}
    >
      <Checkbox 
        id={`check-${id}`}
        checked={isCompleted}
        onCheckedChange={() => toggleCompletion(id)}
        className="h-5 w-5"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className={cn("font-medium truncate", isCompleted && "line-through opacity-70")}>
            {name}
          </div>
          <div className="text-sm font-medium text-muted-foreground flex-shrink-0">
            {quantity}
          </div>
        </div>
        
        {notes && (
          <div className="text-sm text-muted-foreground mt-0.5 truncate">
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
            isFrequent ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
          )}
          onClick={() => toggleFrequent(id)}
          title={isFrequent ? "Remove from frequent" : "Add to frequent"}
        >
          <Star className="h-4 w-4" fill={isFrequent ? "currentColor" : "none"} />
        </Button>
        
        {reuseItem && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-primary hover:text-primary/80"
            onClick={() => reuseItem(item)}
            title="Add to list"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
          onClick={() => deleteItem(id)}
          title="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GroceryItem;
