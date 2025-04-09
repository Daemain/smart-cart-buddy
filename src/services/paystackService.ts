
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo (smallest currency unit)
  currency?: string;
  reference?: string;
  metadata?: Record<string, any>;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

export interface PaystackResponse {
  reference: string;
  status: string;
  transaction: string;
  message: string;
  redirectUrl?: string;
}

// Initialize Paystack Payment
export const initializePayment = (config: PaystackConfig): void => {
  try {
    // Ensure the Paystack script is loaded
    if (typeof window !== 'undefined') {
      loadPaystackScript(() => {
        // Access the PaystackPop object
        if (window.PaystackPop) {
          const handler = window.PaystackPop.setup({
            key: config.publicKey, // Replace with your public key
            email: config.email,
            amount: config.amount,
            currency: config.currency || 'NGN',
            ref: config.reference || generateReference(),
            metadata: config.metadata || {},
            callback: (response: PaystackResponse) => {
              // Handle successful payment
              if (config.callback) {
                config.callback(response);
              }
            },
            onClose: () => {
              // Handle popup close
              if (config.onClose) {
                config.onClose();
              }
            },
          });
          
          handler.openIframe();
        } else {
          toast({
            title: "Payment Error",
            description: "Payment provider not available. Please try again later.",
            variant: "destructive",
          });
        }
      });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    toast({
      title: "Payment Error",
      description: "Could not initialize payment. Please try again.",
      variant: "destructive",
    });
  }
};

// Generate a unique reference for the transaction
const generateReference = (): string => {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 12);
  return `scb-${timestamp}-${randomStr}`;
};

// Verify payment status with backend
export const verifyPayment = async (reference: string): Promise<boolean> => {
  try {
    // Call Supabase edge function to verify payment
    const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
      body: { reference }
    });
    
    if (error) throw error;
    
    return data?.success === true;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};

// Update user premium status
export const updatePremiumStatus = async (userId: string, isPremium: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Update premium status error:', error);
    return false;
  }
};

// Load Paystack script dynamically
const loadPaystackScript = (callback: () => void): void => {
  // Check if script is already loaded
  if (document.querySelector('script[src*="paystack.com/js/inline.js"]')) {
    callback();
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://js.paystack.co/v1/inline.js';
  script.async = true;
  script.onload = callback;
  script.onerror = () => {
    toast({
      title: "Payment Error",
      description: "Failed to load payment provider. Please try again later.",
      variant: "destructive",
    });
  };
  document.head.appendChild(script);
};

// Declare PaystackPop globally for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}
