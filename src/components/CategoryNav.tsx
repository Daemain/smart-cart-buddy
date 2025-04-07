
import React from 'react';
import { GroceryCategory } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { ListFilter, Star, CheckCircle, Zap, Lock } from 'lucide-react';

interface CategoryNavProps {
  activeCategory: GroceryCategory;
  setActiveCategory: (category: GroceryCategory) => void;
  counts: {
    all: number;
    frequent: number;
    completed: number;
    suggested: number;
  };
  isPremium?: boolean;
}

const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  setActiveCategory,
  counts,
  isPremium = false,
}) => {
  const categories: { id: GroceryCategory; label: string; icon: React.ReactNode; premium?: boolean }[] = [
    {
      id: 'all',
      label: 'All',
      icon: <ListFilter className="h-4 w-4" />,
    },
    {
      id: 'frequent',
      label: 'Frequent',
      icon: <Star className="h-4 w-4" />,
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: 'suggested',
      label: 'Suggested',
      icon: <Zap className="h-4 w-4" />,
      premium: true,
    },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar pb-1">
      {categories.map((category) => (
        <button
          key={category.id}
          className={cn(
            "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full transition-colors mr-2 whitespace-nowrap",
            activeCategory === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          onClick={() => setActiveCategory(category.id)}
        >
          {category.icon}
          <span>{category.label}</span>
          <span className="inline-flex items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-xs min-w-5">
            {counts[category.id]}
          </span>
          {category.premium && !isPremium && (
            <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryNav;
