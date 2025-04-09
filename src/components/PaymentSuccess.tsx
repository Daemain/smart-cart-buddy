
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { verifyPayment, updatePremiumStatus } from '@/services/paystackService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handlePaymentVerification = async () => {
      if (!reference || !user) {
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        const isVerified = await verifyPayment(reference);
        
        if (isVerified) {
          // Update user's premium status
          const updated = await updatePremiumStatus(user.id, true);
          
          if (updated) {
            setIsSuccess(true);
            toast({
              title: "Payment Successful",
              description: "You are now a premium user! Enjoy all premium features.",
            });
          } else {
            throw new Error("Failed to update premium status");
          }
        } else {
          throw new Error("Payment verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        toast({
          title: "Verification Failed",
          description: "We couldn't verify your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    handlePaymentVerification();
  }, [reference, user]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Verifying Your Payment</h1>
            <p className="text-center text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-center text-muted-foreground">
              Congratulations! You've successfully upgraded to premium. Enjoy all the premium features of Smart Cart Buddy!
            </p>
            <Button className="mt-4 w-full" onClick={handleContinue}>
              Continue to App
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
            <p className="text-center text-muted-foreground">
              We couldn't verify your payment. If you believe this is an error, please contact our support team.
            </p>
            <Button className="mt-4 w-full" onClick={handleContinue}>
              Return to App
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
