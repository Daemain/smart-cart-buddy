
import React, { useState } from 'react';
import { Recipe } from '@/types/grocery';
import { ChefHat, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface RecipeFolderProps {
  recipes: Recipe[];
  onAddToList: (recipe: Recipe) => void;
}

const RecipeFolder: React.FC<RecipeFolderProps> = ({ recipes, onAddToList }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-md overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span className="font-medium">My Recipes</span>
            <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              {recipes.length}
            </span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{recipe.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {recipe.ingredients.length} ingredients • Added {formatDistanceToNow(recipe.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onAddToList(recipe)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Add to list</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RecipeFolder;
