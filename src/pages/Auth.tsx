
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, User, Mail, Lock, Facebook, Instagram } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

const Auth = () => {
  const { user, isLoading, signIn, signUp, signInWithGoogle, signInWithFacebook, signInWithInstagram } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUp(email, password);
      // We don't navigate here because the user needs to verify their email
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'instagram') => {
    setIsSubmitting(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'facebook') {
        await signInWithFacebook();
      } else if (provider === 'instagram') {
        await signInWithInstagram();
      }
      // No navigation needed here as OAuth redirects happen automatically
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Google icon since it's not available in lucide-react
  const GoogleIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-4 w-4 mr-2" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12 h8" />
      <path d="M12 8 v8" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/90 p-4">
      <div className="flex items-center mb-8">
        <div className="bg-primary rounded-full p-2 text-primary-foreground mr-2">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Smart Cart Buddy</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Welcome to Smart Cart Buddy</CardTitle>
          <CardDescription className="text-center">
            Sign in to manage your grocery lists, recipes, and more
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="relative w-full flex items-center justify-center">
                  <hr className="w-full border-t border-gray-300" />
                  <span className="absolute bg-background px-2 text-xs text-gray-500">OR</span>
                </div>
                
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} w-full`}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('google')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <GoogleIcon />
                    {!isMobile && 'Google'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    {!isMobile && 'Facebook'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('instagram')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    {!isMobile && 'Instagram'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
                
                <div className="relative w-full flex items-center justify-center">
                  <hr className="w-full border-t border-gray-300" />
                  <span className="absolute bg-background px-2 text-xs text-gray-500">OR</span>
                </div>
                
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} w-full`}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('google')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <GoogleIcon />
                    {!isMobile && 'Google'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    {!isMobile && 'Facebook'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSocialLogin('instagram')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    {!isMobile && 'Instagram'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
