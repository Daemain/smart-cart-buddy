
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface RecipeFolderProps {
  recipes: Recipe[];
  onAddToList: (recipe: Recipe) => void;
  onCompleteRecipe?: (recipe: Recipe) => void;
  activeCategory: string;
}

const RecipeFolder: React.FC<RecipeFolderProps> = ({ 
  recipes, 
  onAddToList, 
  onCompleteRecipe,
  activeCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState<Record<string, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [completedRecipes, setCompletedRecipes] = useState<Record<string, boolean>>({});

  // Only show on the 'all' or 'completed' category
  if (recipes.length === 0 || (activeCategory !== 'all' && activeCategory !== 'completed')) {
    return null;
  }

  // Filter recipes based on the active category
  const filteredRecipes = recipes.filter((recipe) => {
    if (activeCategory === 'all') {
      // Only show non-completed recipes in "All"
      return !completedRecipes[recipe.id];
    } else if (activeCategory === 'completed') {
      // Only show completed recipes in "Completed"
      return completedRecipes[recipe.id];
    }
    return true;
  });

  // Don't render if there are no filtered recipes to show
  if (filteredRecipes.length === 0) {
    return null;
  }

  const toggleRecipeDetails = (recipeId: string) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const toggleIngredientCheck = (recipeId: string, ingredientIndex: number) => {
    const key = `${recipeId}-${ingredientIndex}`;
    setCheckedIngredients(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCompleteRecipe = (recipe: Recipe) => {
    if (onCompleteRecipe) {
      // Update local state to track completed recipes
      setCompletedRecipes(prev => ({
        ...prev,
        [recipe.id]: !prev[recipe.id]
      }));
      onCompleteRecipe(recipe);
    }
  };

  return (
    <div className="mb-6">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-lg overflow-hidden shadow-sm"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-medium">My Recipes</span>
            <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              {filteredRecipes.length}
            </span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="group">
                <div className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {onCompleteRecipe && (
                        <Checkbox 
                          id={`recipe-${recipe.id}`} 
                          className="h-5 w-5 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          checked={!!completedRecipes[recipe.id]}
                          onCheckedChange={() => handleCompleteRecipe(recipe)}
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="font-medium text-base">{recipe.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {recipe.ingredients.length} ingredients • Added {formatDistanceToNow(recipe.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 opacity-70 group-hover:opacity-100 transition-opacity"
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
                    <div className="mt-4 pl-6 border-l-2 border-primary/20 animate-fade-in">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3">Ingredients:</h4>
                      <ul className="space-y-3">
                        {recipe.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-center group/item">
                            <div className="flex items-center flex-1 min-w-0">
                              <Checkbox 
                                checked={!!checkedIngredients[`${recipe.id}-${index}`]}
                                onCheckedChange={() => toggleIngredientCheck(recipe.id, index)}
                                className="h-4 w-4 mr-3 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                id={`ingredient-${recipe.id}-${index}`}
                              />
                              <label 
                                htmlFor={`ingredient-${recipe.id}-${index}`}
                                className={cn(
                                  "flex items-center cursor-pointer text-sm w-full",
                                  checkedIngredients[`${recipe.id}-${index}`] && "line-through text-muted-foreground"
                                )}
                              >
                                <span className="font-medium">{ingredient.name}</span>
                                {ingredient.quantity && (
                                  <span className="text-muted-foreground ml-2 text-xs bg-muted/40 px-1.5 py-0.5 rounded-full">
                                    {ingredient.quantity}
                                  </span>
                                )}
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 bg-primary/5 hover:bg-primary/10 text-primary"
                          onClick={() => onAddToList(recipe)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1.5" />
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
