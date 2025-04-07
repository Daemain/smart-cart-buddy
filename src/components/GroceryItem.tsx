import React from 'react';
import { GroceryItem as GroceryItemType } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Star, Trash2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-mobile';
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
  reuseItem
}) => {
  const {
    id,
    name,
    quantity,
    notes,
    isCompleted,
    isFrequent
  } = item;
  const isMobile = useIsMobile();
  return <div className={cn("border rounded-lg overflow-hidden mb-3 shadow-sm", isCompleted ? "border-muted bg-muted/20" : "border-border", isFrequent ? "border-primary/40" : "")}>
      <div className="flex items-start p-3 gap-3">
        <Checkbox id={`check-${id}`} checked={isCompleted} onCheckedChange={() => toggleCompletion(id)} className="h-5 w-5 flex-shrink-0 mt-1" />
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-2 w-full">
            <div className={cn("font-medium text-left w-full", isCompleted && "line-through opacity-70")}>
              {name}
            </div>
            
            {quantity && <div className="text-xsm font-regular bg-primary/10 text-primary px-2 py-0.5 rounded-full self-start">
                {quantity}
              </div>}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", isFrequent ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500")} onClick={() => toggleFrequent(id)} title={isFrequent ? "Remove from frequent" : "Add to frequent"}>
            <Star className="h-4 w-4" fill={isFrequent ? "currentColor" : "none"} />
          </Button>
          
          {reuseItem && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:text-primary/80" onClick={() => reuseItem(item)} title="Add to list">
              <Plus className="h-4 w-4" />
            </Button>}
          
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={() => deleteItem(id)} title="Delete item">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {notes && <div className="px-3 pb-3 w-full">
          {isMobile || notes.length <= 120 ? <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded-md w-full border border-border/50">
              {notes}
            </div> : <div className="relative">
              <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded-md line-clamp-2 border border-border/50">
                {notes}
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" className="mt-1 h-6 text-xs w-auto">
                      <Info className="h-3 w-3 mr-1" />
                      Show more
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs">
                    <p className="whitespace-normal break-words">{notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>}
        </div>}
    </div>;
};
export default GroceryItem;