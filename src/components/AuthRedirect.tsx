
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // This component handles the redirect after OAuth authentication
    const handleAuthRedirect = async () => {
      // Check if this is a password reset flow
      const url = new URL(window.location.href);
      const type = url.searchParams.get('type');
      
      console.log('Auth redirect detected:', { type });
      
      if (type === 'recovery') {
        // Redirect to auth page with recovery type preserved
        navigate('/auth?type=recovery', { replace: true });
        return;
      }
      
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        // If session exists, redirect to app dashboard instead of home page
        navigate('/app', { replace: true });
      } else if (error) {
        console.error('Auth redirect error:', error);
        navigate('/auth', { replace: true });
      } else {
        // No session, no error - probably still in the auth flow
        navigate('/auth', { replace: true });
      }
    };

    handleAuthRedirect();
  }, [navigate, location]);

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
