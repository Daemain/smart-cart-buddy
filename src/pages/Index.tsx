
import React, { useState, useEffect } from 'react';
import { useGroceryList } from '@/hooks/useGroceryList';
import GroceryItem from '@/components/GroceryItem';
import AddGroceryForm from '@/components/AddGroceryForm';
import CategoryNav from '@/components/CategoryNav';
import EmptyState from '@/components/EmptyState';
import SuggestedItems from '@/components/SuggestedItems';
import PremiumBanner from '@/components/PremiumBanner';
import RecipeExtractor from '@/components/RecipeExtractor';
import RecipeFolder from '@/components/RecipeFolder';
import { ShoppingCart, Menu, LogOut, User } from 'lucide-react';
import { GroceryCategory, Recipe } from '@/types/grocery';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const {
    groceries,
    allGroceries,
    activeCategory,
    setActiveCategory,
    addGroceryItem,
    updateItem,
    deleteItem,
    toggleCompletion,
    toggleFrequent,
    reuseItem,
    suggestedItems,
    saveRecipe,
    deleteRecipe,
    recipes,
    onCompleteRecipe,
    addIngredientToRecipe,
    isLoading,
    counts
  } = useGroceryList();
  
  const {
    user,
    profile,
    signOut
  } = useAuth();
  
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasFreeTrialUsed, setHasFreeTrialUsed] = useState(false);
  const [recipeUsageCount, setRecipeUsageCount] = useState(0);
  
  useEffect(() => {
    if (profile?.is_premium) {
      setIsPremium(true);
    }

    const trialUsed = localStorage.getItem('premiumTrialUsed') === 'true';
    setHasFreeTrialUsed(trialUsed);
    
    const storedCount = localStorage.getItem('recipeUsageCount');
    if (storedCount) {
      setRecipeUsageCount(parseInt(storedCount, 10));
    }
    
    if (allGroceries.length > 3 && !isPremium && !showPremiumBanner) {
      setShowPremiumBanner(true);
    }
  }, [allGroceries.length, isPremium, showPremiumBanner, profile]);
  
  const handleToggleCompletion = (id: string) => {
    const item = allGroceries.find(item => item.id === id);
    if (!item) return;
    
    if (!item.isCompleted) {
      toggleCompletion(id);
      if (activeCategory !== 'completed') {
        toast({
          title: "Item completed",
          description: "Item moved to completed items",
        });
        setActiveCategory('completed');
      }
    } else {
      toggleCompletion(id);
    }
  };
  
  const handleRecipeExtracted = (ingredients: {
    name: string;
    quantity: string;
  }[], recipeName: string) => {
    // Check if user can save more recipes (premium or under usage limit)
    if (!isPremium && recipeUsageCount >= 2) {
      toast({
        title: "Premium Feature",
        description: "You've used your 2 free recipe saves. Upgrade to premium for unlimited recipes.",
        variant: "destructive"
      });
      return;
    }
    
    saveRecipe(recipeName, ingredients).then(newRecipe => {
      toast({
        title: "Recipe extracted",
        description: `"${recipeName}" with ${ingredients.length} ingredients has been saved to your recipes.`,
      });
      
      // Update local recipe usage count after successful save
      if (!isPremium) {
        const newCount = recipeUsageCount + 1;
        setRecipeUsageCount(newCount);
      }
    }).catch(error => {
      console.error('Failed to save recipe:', error);
      toast({
        title: "Failed to save recipe",
        description: "An error occurred while saving your recipe.",
        variant: "destructive"
      });
    });
  };

  const canAccessPremium = isPremium || !hasFreeTrialUsed;
  const canAccessRecipes = isPremium || recipeUsageCount < 2;
  
  const handleUpgrade = () => {
    setIsPremium(true);
    toast({
      title: "Welcome to Premium!",
      description: "You now have access to all premium features including AI-powered ingredient extraction."
    });
  };
  
  return (
    <div className="min-h-screen bg-app-background flex flex-col">
      <header className="sticky top-0 z-10 bg-app-background shadow-sm border-b">
        <div className="max-w-md mx-auto px-2 py-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-1 text-primary-foreground">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h1 className="font-bold text-sm">Smart Cart Buddy</h1>
            </div>
            <div className="flex items-center gap-2">
              <AddGroceryForm addGroceryItem={addGroceryItem} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    {profile?.username || user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    {isPremium ? 'Premium User' : 'Free User'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <CategoryNav 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
            counts={counts} 
            isPremium={canAccessPremium}
            recipeUsageCount={recipeUsageCount} 
          />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-0">
        {showPremiumBanner && <PremiumBanner onDismiss={() => setShowPremiumBanner(false)} onUpgrade={handleUpgrade} />}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading your grocery list...</span>
          </div>
        ) : (
          <>
            {activeCategory === 'suggested' && (
              <>
                {canAccessPremium ? (
                  <SuggestedItems items={suggestedItems || []} reuseItem={reuseItem} />
                ) : (
                  <div className="mt-6 mb-4">
                    <EmptyState category="suggested" isPremium={false} onUpgrade={handleUpgrade} />
                  </div>
                )}
                {!isPremium && !hasFreeTrialUsed && activeCategory === 'suggested' && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4 text-sm">
                    <p className="font-medium text-amber-700">You're using your free trial</p>
                    <p className="text-amber-600">This is a one-time preview of our premium features.</p>
                  </div>
                )}
              </>
            )}
            
            {(activeCategory !== 'suggested' || canAccessPremium) && (
              <>
                <div className="flex justify-start my-3">
                  <RecipeExtractor onExtractComplete={handleRecipeExtracted} isPremium={canAccessPremium} />
                </div>
                
                {/* Show recipe folder with premium restriction */}
                {canAccessRecipes ? (
                  <RecipeFolder 
                    recipes={recipes} 
                    onCompleteRecipe={onCompleteRecipe}
                    activeCategory={activeCategory}
                    onDeleteRecipe={deleteRecipe}
                    onAddIngredientToRecipe={addIngredientToRecipe}
                  />
                ) : (
                  <div className="bg-card border border-border rounded-lg p-4 mb-4">
                    <div className="flex flex-col items-center text-center">
                      <h3 className="font-medium">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've used your 2 free recipe saves. Upgrade to premium for unlimited recipes.
                      </p>
                      <Button 
                        onClick={handleUpgrade}
                        className="mt-3 bg-gradient-to-r from-primary to-secondary"
                        size="sm"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 mt-1">
                  {groceries.length === 0 ? (
                    <EmptyState category={activeCategory} isPremium={canAccessPremium} />
                  ) : (
                    groceries.map(item => (
                      <GroceryItem 
                        key={item.id} 
                        item={item} 
                        toggleCompletion={handleToggleCompletion} 
                        toggleFrequent={toggleFrequent} 
                        deleteItem={deleteItem} 
                        reuseItem={activeCategory === 'frequent' ? reuseItem : undefined} 
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
