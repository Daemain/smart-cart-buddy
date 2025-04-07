
import React, { useState } from 'react';
import { Recipe } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChefHat, Upload, PlusCircle, X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface RecipeExtractorProps {
  onExtractComplete: (ingredients: { name: string; quantity: string }[]) => void;
  isPremium: boolean;
}

const RecipeExtractor: React.FC<RecipeExtractorProps> = ({ 
  onExtractComplete,
  isPremium
}) => {
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [open, setOpen] = useState(false);

  // Mock recipe parsing function (in a real app, you'd use an API)
  const parseRecipe = (text: string): { name: string; quantity: string }[] => {
    // This is a simplified mock parser for demonstration
    // In a real implementation, you'd use an API call to a service like GPT-4
    const lines = text.split('\n');
    const ingredients: { name: string; quantity: string }[] = [];
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      
      // Basic parsing - looking for patterns like "2 cups flour" or "1/2 teaspoon salt"
      const quantityMatch = line.match(/^([\d\/\.\s]+)?\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|pound|lb|g|kg|ml|l)s?\s+of\s+(.+)$/) || 
                          line.match(/^([\d\/\.\s]+)?\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|pound|lb|g|kg|ml|l)s?\s+(.+)$/) ||
                          line.match(/^([\d\/\.\s]+)?\s+(.+)$/);
      
      if (quantityMatch) {
        const quantity = quantityMatch[1] ? quantityMatch[1].trim() : '';
        const unit = quantityMatch[2] ? quantityMatch[2].trim() : '';
        const name = quantityMatch[3] ? quantityMatch[3].trim() : quantityMatch[2];
        
        const quantityText = [quantity, unit].filter(Boolean).join(' ');
        ingredients.push({ 
          name: name, 
          quantity: quantityText || '1'
        });
      } else if (line.length > 2 && !line.startsWith('Step')) {
        // If we can't parse it but it looks like an ingredient, add it
        ingredients.push({ name: line, quantity: '' });
      }
    });
    
    return ingredients;
  };

  const handleExtract = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Recipe extraction is a premium feature. Please upgrade to use it.",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }

    if (!recipeText && !recipeUrl) {
      toast({
        title: "Missing Information",
        description: "Please enter a recipe or URL to extract ingredients.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      // In a real app, this would be an API call to a service like OpenAI
      // For now, we'll use our mock parser
      const ingredients = parseRecipe(recipeText);
      
      if (ingredients.length === 0) {
        toast({
          title: "No ingredients found",
          description: "We couldn't extract any ingredients from the text. Please try reformatting or use a different recipe.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Recipe extracted",
          description: `Found ${ingredients.length} ingredients in your recipe.`,
        });
        onExtractComplete(ingredients);
        setOpen(false);
        setRecipeText('');
        setRecipeUrl('');
      }
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: "There was an error extracting the recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-10 min-w-[40px] sm:min-w-fit">
          <ChefHat className="h-5 w-5" />
          <span className="hidden sm:inline">Recipe to List</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extract Grocery List from Recipe</DialogTitle>
          <DialogDescription>
            {isPremium 
              ? "Paste your recipe or provide a URL to extract ingredients" 
              : "Recipe extraction is a premium feature"}
          </DialogDescription>
        </DialogHeader>
        
        {!isPremium ? (
          <div className="flex flex-col items-center justify-center py-6">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              Upgrade to premium to automatically extract ingredients from recipes
            </p>
            <Button 
              className="mt-4" 
              onClick={() => {
                setOpen(false);
                // This would trigger the upgrade flow in a real app
                toast({
                  title: "Premium Feature",
                  description: "Recipe extraction is a premium feature. Please upgrade to use it.",
                });
              }}
            >
              Upgrade to Premium
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <label htmlFor="recipe-text" className="text-sm font-medium">
                  Paste your recipe
                </label>
                <Textarea
                  id="recipe-text"
                  placeholder="Paste your recipe ingredients and instructions here..."
                  rows={8}
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="recipe-url" className="text-sm font-medium">
                  Recipe URL (coming soon)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="recipe-url"
                    placeholder="https://example.com/recipe"
                    value={recipeUrl}
                    onChange={(e) => setRecipeUrl(e.target.value)}
                    disabled={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL parsing will be available in a future update
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting || (!recipeText && !recipeUrl)}
              >
                {isExtracting ? "Extracting..." : "Extract Ingredients"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeExtractor;
