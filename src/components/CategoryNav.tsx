
import React from 'react';
import { GroceryCategory } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { ListFilter, Star, CheckCircle } from 'lucide-react';

interface CategoryNavProps {
  activeCategory: GroceryCategory;
  setActiveCategory: (category: GroceryCategory) => void;
  counts: {
    all: number;
    frequent: number;
    completed: number;
  };
}

const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  setActiveCategory,
  counts,
}) => {
  const categories: { id: GroceryCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: 'All Items',
      icon: <ListFilter className="h-4 w-4" />,
    },
    {
      id: 'frequent',
      label: 'Frequent Items',
      icon: <Star className="h-4 w-4" />,
    },
    {
      id: 'completed',
      label: 'Completed Items',
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 bg-app-background sticky top-0 z-10">
      {categories.map((category) => (
        <button
          key={category.id}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors mr-2 whitespace-nowrap",
            activeCategory === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          onClick={() => setActiveCategory(category.id)}
        >
          {category.icon}
          {category.label}
          <span className="inline-flex items-center justify-center rounded-full bg-primary-foreground/20 px-2 text-xs">
            {counts[category.id]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryNav;
