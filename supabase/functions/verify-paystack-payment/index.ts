
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    customer: {
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Missing Paystack secret key');
    }

    const { reference } = await req.json();
    
    if (!reference) {
      throw new Error('Missing payment reference');
    }

    console.log(`Verifying payment with reference: ${reference}`);

    // Call Paystack API to verify the payment
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result: PaystackVerifyResponse = await response.json();
    console.log("Paystack verification response:", JSON.stringify(result));

    if (!result.status) {
      throw new Error(result.message || 'Payment verification failed');
    }

    // Check if payment is successful
    if (result.data?.status !== 'success') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment not successful' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Verify the amount (1.99 USD in kobo or your local currency)
    // This should match your subscription price
    const expectedAmount = 199 * 100; // Convert $1.99 to cents/kobo
    if (result.data.amount < expectedAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment amount incorrect' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Extract user ID from metadata if available
    const userId = result.data?.metadata?.userId;
    
    // Payment verified successfully
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference: result.data.reference,
          email: result.data.customer.email,
          userId: userId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to verify payment',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
