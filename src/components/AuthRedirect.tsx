
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This component handles the redirect after OAuth authentication
    const handleAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        // If session exists, redirect to home page
        navigate('/', { replace: true });
      } else if (error) {
        console.error('Auth redirect error:', error);
        navigate('/auth', { replace: true });
      } else {
        // No session, no error - probably still in the auth flow
        navigate('/auth', { replace: true });
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthRedirect;
