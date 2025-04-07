
export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  notes?: string;
  isCompleted: boolean;
  isFrequent: boolean;
  createdAt: number;
  category?: string; // Optional category for organization
  lastPurchased?: number; // For auto-suggestions based on history
  fromRecipe?: string; // To track which recipe an item came from
  recipeId?: string; // Link to the recipe this item belongs to
}

export type GroceryList = GroceryItem[];

export type GroceryCategory = 'all' | 'frequent' | 'completed' | 'suggested';

export interface GroceryCounts {
  all: number;
  frequent: number;
  completed: number;
  suggested: number;
}

export interface PremiumFeatures {
  autoSuggest: boolean;
  sharedLists: boolean;
  darkMode: boolean;
  barcodeScanner: boolean;
  recipeExtractor: boolean; // Premium feature for recipe extraction after free uses
  recipeExtractorUsageCount: number; // Track usage for free tier limits
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: {
    name: string;
    quantity: string;
    unit?: string;
  }[];
  instructions?: string[];
  url?: string;
  imageUrl?: string;
  createdAt: number;
}

export interface RecipeFolder {
  recipes: Recipe[];
}
