
import React from 'react';
import { GroceryCategory } from '@/types/grocery';
import { ShoppingCart, Star, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  category: GroceryCategory;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ category, isPremium = true, onUpgrade }) => {
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
      case 'suggested':
        return {
          icon: <Zap className="h-12 w-12 text-muted-foreground" />,
          title: isPremium ? 'No suggested items yet' : 'Upgrade to Premium',
          description: isPremium 
            ? 'Use the app more to get personalized suggestions.' 
            : 'Get smart suggestions based on your shopping habits.',
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
    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg bg-card bg-opacity-50 border border-border">
      <div className="rounded-full bg-muted p-4 mb-4">{content.icon}</div>
      <h3 className="text-lg font-medium">{content.title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs px-4">
        {content.description}
      </p>
      
      {category === 'suggested' && !isPremium && onUpgrade && (
        <Button 
          onClick={onUpgrade} 
          className="mt-4 bg-gradient-to-r from-primary to-secondary"
        >
          Upgrade to Premium <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
