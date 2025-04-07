
import React, { useRef, useState, useEffect } from 'react';
import { GroceryCategory } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { ListFilter, Star, CheckCircle, Zap, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check if scrolling is needed
  const checkForScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  // Handle scroll in the container
  const handleScroll = () => {
    checkForScrollPosition();
  };

  // Check on mount and window resize
  useEffect(() => {
    checkForScrollPosition();
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, []);

  // Custom scroll handler buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

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
    <div className="relative">
      {/* Left scroll indicator */}
      {showLeftScroll && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-app-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      
      {/* Categories container with scroll */}
      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto no-scrollbar pb-1 px-6" 
        onScroll={handleScroll}
      >
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
      
      {/* Right scroll indicator */}
      {showRightScroll && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-app-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default CategoryNav;
