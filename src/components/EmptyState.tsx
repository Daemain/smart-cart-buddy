
import React from 'react';
import { GroceryCategory } from '@/types/grocery';
import { ShoppingCart, Star, CheckCircle } from 'lucide-react';

interface EmptyStateProps {
  category: GroceryCategory;
}

const EmptyState: React.FC<EmptyStateProps> = ({ category }) => {
  const renderContent = () => {
    switch (category) {
      case 'all':
        return {
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: 'No items in your list',
          description: 'Add items to your grocery list to get started.',
        };
      case 'frequent':
        return {
          icon: <Star className="h-12 w-12 text-muted-foreground" />,
          title: 'No frequent items',
          description: 'Star your favorite items to add them to your frequent list.',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-12 w-12 text-muted-foreground" />,
          title: 'No completed items',
          description: 'Check off items as you shop to see them here.',
        };
      default:
        return {
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: 'No items found',
          description: 'Add items to your grocery list to get started.',
        };
    }
  };

  const content = renderContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">{content.icon}</div>
      <h3 className="text-lg font-medium">{content.title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {content.description}
      </p>
    </div>
  );
};

export default EmptyState;
