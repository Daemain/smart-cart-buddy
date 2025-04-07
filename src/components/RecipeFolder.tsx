
import React, { useState } from 'react';
import { Recipe } from '@/types/grocery';
import { ChefHat, ChevronDown, ChevronUp, PlusCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RecipeFolderProps {
  recipes: Recipe[];
  onAddToList: (recipe: Recipe) => void;
}

const RecipeFolder: React.FC<RecipeFolderProps> = ({ recipes, onAddToList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState<Record<string, boolean>>({});

  if (recipes.length === 0) {
    return null;
  }

  const toggleRecipeDetails = (recipeId: string) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

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
          <div>
            {recipes.map((recipe) => (
              <div key={recipe.id} className="border-b last:border-b-0">
                <div className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{recipe.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {recipe.ingredients.length} ingredients • Added {formatDistanceToNow(recipe.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => toggleRecipeDetails(recipe.id)}
                    >
                      {expandedRecipes[recipe.id] ? (
                        <EyeOffIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <EyeIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">{expandedRecipes[recipe.id] ? 'Hide' : 'View'}</span>
                    </Button>
                  </div>
                  
                  {expandedRecipes[recipe.id] && (
                    <div className="mt-3 pl-3 border-l-2 border-muted">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Ingredients:</h4>
                      <ul className="space-y-1">
                        {recipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="text-sm flex items-center">
                            <span className="w-4 h-4 inline-flex items-center justify-center text-xs text-muted-foreground mr-2">•</span>
                            <span className="font-medium">{ingredient.name}</span>
                            {ingredient.quantity && (
                              <span className="text-muted-foreground ml-1">{ingredient.quantity}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => onAddToList(recipe)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Add to list</span>
                        </Button>
                      </div>
                    </div>
                  )}
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
