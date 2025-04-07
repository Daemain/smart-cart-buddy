
import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Star, Trash2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          
          {quantity && (
            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
              {quantity}
            </div>
          )}
        </div>
        
        {notes && (
          <div className="relative">
            <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1 pr-5">
              {notes}
            </div>
            
            {notes.length > 60 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs whitespace-normal break-words">{notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
