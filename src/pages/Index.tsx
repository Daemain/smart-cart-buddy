
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
    recipes,
    addRecipeToList,
    isLoading
  } = useGroceryList();
  
  const {
    user,
    profile,
    signOut
  } = useAuth();
  
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasFreeTrialUsed, setHasFreeTrialUsed] = useState(false);
  
  useEffect(() => {
    if (profile?.is_premium) {
      setIsPremium(true);
    }

    // Check if free trial has been used
    const trialUsed = localStorage.getItem('premiumTrialUsed') === 'true';
    setHasFreeTrialUsed(trialUsed);
    if (allGroceries.length > 3 && !isPremium && !showPremiumBanner) {
      setShowPremiumBanner(true);
    }
  }, [allGroceries.length, isPremium, showPremiumBanner, profile]);
  
  // Custom handler for toggling completion
  const handleToggleCompletion = (id: string) => {
    // First, get the current item
    const item = allGroceries.find(item => item.id === id);
    if (!item) return;
    
    // If the item is not completed and we're marking it as completed,
    // and we're not already in the completed category
    if (!item.isCompleted && activeCategory !== 'completed') {
      // Toggle the completion status
      toggleCompletion(id);
      
      // Show toast notification
      toast({
        title: "Item completed",
        description: "Item moved to completed items",
      });
      
      // Change the category to 'completed' 
      // (commented out to stay on same page, uncomment if you want to navigate)
      // setActiveCategory('completed');
    } else {
      // Regular toggle
      toggleCompletion(id);
    }
  };
  
  const counts = {
    all: allGroceries.length,
    frequent: allGroceries.filter(item => item.isFrequent).length,
    completed: allGroceries.filter(item => item.isCompleted).length,
    suggested: suggestedItems?.length || 0
  };
  
  const handleRecipeExtracted = (ingredients: {
    name: string;
    quantity: string;
  }[], recipeName: string) => {
    saveRecipe(recipeName, ingredients).then(newRecipe => {
      ingredients.forEach(ingredient => {
        addGroceryItem(ingredient.name, ingredient.quantity || '1', undefined, newRecipe.id);
      });
    }).catch(error => {
      console.error('Failed to save recipe:', error);
    });
  };

  // Logic to handle premium trial access
  const canAccessPremium = isPremium || !hasFreeTrialUsed;
  
  const handleUpgrade = () => {
    setIsPremium(true);
    toast({
      title: "Welcome to Premium!",
      description: "You now have access to all premium features."
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
          
          <CategoryNav activeCategory={activeCategory} setActiveCategory={setActiveCategory} counts={counts} isPremium={canAccessPremium} />
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
                
                <RecipeFolder recipes={recipes} onAddToList={addRecipeToList} />
                
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
