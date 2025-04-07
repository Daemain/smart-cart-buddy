
import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumBannerProps {
  onDismiss: () => void;
  onUpgrade: () => void;
}

const PremiumBanner: React.FC<PremiumBannerProps> = ({ onDismiss, onUpgrade }) => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3 mb-4 relative animate-fade-in">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-1 top-1 h-6 w-6 opacity-70 hover:opacity-100"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <h3 className="font-medium text-sm">Upgrade to Premium</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Unlock auto-suggestions, shared lists, dark mode, and more for just $1.99/month.
      </p>
      
      <Button 
        onClick={onUpgrade} 
        className="w-full bg-gradient-to-r from-primary to-secondary text-white"
        size="sm"
      >
        Upgrade Now
      </Button>
    </div>
  );
};

export default PremiumBanner;
