
export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  notes?: string;
  isCompleted: boolean;
  isFrequent: boolean;
  createdAt: number;
}

export type GroceryList = GroceryItem[];

export type GroceryCategory = 'all' | 'frequent' | 'completed';
