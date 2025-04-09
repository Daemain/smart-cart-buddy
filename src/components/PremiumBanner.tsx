
import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { initializePayment } from '@/services/paystackService';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface PremiumBannerProps {
  onDismiss: () => void;
  onUpgrade?: () => void;
}

// Paystack public key - using live key
const PAYSTACK_PUBLIC_KEY = 'pk_live_17192c1c2a5e395f00b232ef6ebfee74f2c49244'; // Live public key

const PremiumBanner: React.FC<PremiumBannerProps> = ({
  onDismiss,
  onUpgrade
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleUpgrade = () => {
    if (!user || !user.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }
    
    // Call the onUpgrade callback if provided
    if (onUpgrade) {
      onUpgrade();
    }
    
    // Initialize Paystack payment
    initializePayment({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: 299 * 100, // $2.99 in cents/kobo
      metadata: {
        userId: user.id,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: "Premium"
          }
        ]
      },
      callback: (response) => {
        // Redirect to success page with reference
        navigate(`/payment/success?reference=${response.reference}`);
      },
      onClose: () => {
        toast({
          title: "Payment Cancelled",
          description: "You've cancelled the payment process. You can try again anytime.",
        });
      }
    });
  };
  
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3 mb-4 relative animate-fade-in">
      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6 opacity-70 hover:opacity-100" onClick={onDismiss}>
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <h3 className="font-medium text-sm">Upgrade to Premium</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">Unlock auto-suggestions, use Deepseek AI to extract ingredients from your favourite meals, shared lists, dark mode, and more for just $2.99/month</p>
      
      <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-primary to-secondary text-white" size="sm">
        Upgrade Now
      </Button>
    </div>
  );
};

export default PremiumBanner;
