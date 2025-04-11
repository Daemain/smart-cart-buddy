
import React, { useState } from 'react';
import { Sparkles, X, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpgrade = async () => {
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
    
    setIsLoading(true);
    
    try {
      console.log("Initializing Paystack payment for:", user.email);
      
      // Initialize Paystack payment
      initializePayment({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: 1090 * 100, // ₦1,090 (equivalent to roughly $2.99) in kobo
        currency: "NGN", // Use NGN (Nigerian Naira) instead of USD
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
          console.log("Payment successful:", response);
          // Redirect to success page with reference
          navigate(`/payment/success?reference=${response.reference}`);
          setIsLoading(false);
        },
        onClose: () => {
          console.log("Payment window closed");
          toast({
            title: "Payment Cancelled",
            description: "You've cancelled the payment process. You can try again anytime.",
          });
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Paystack payment error:", error);
      setIsLoading(false);
      toast({
        title: "Payment Error",
        description: "There was an issue connecting to the payment gateway. Please try again later.",
        variant: "destructive",
      });
    }
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
      
      <p className="text-xs text-muted-foreground mb-2">Unlock auto-suggestions, use Deepseek AI to extract ingredients from your favourite meals, shared lists, dark mode, and more for just ₦1,090/month</p>
      
      <Button 
        onClick={handleUpgrade} 
        className="w-full bg-gradient-to-r from-primary to-secondary text-white" 
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Upgrade Now"}
      </Button>
      
      {isLoading && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <AlertCircle className="h-3 w-3 text-muted-foreground animate-pulse" />
          <p className="text-xs text-muted-foreground">Please don't close this window</p>
        </div>
      )}
    </div>
  );
};

export default PremiumBanner;
