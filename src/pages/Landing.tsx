
import React, { useState } from 'react';
import { ArrowRight, ShoppingCart, MessageCircle, Menu, X, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { showTawkToChat } from '@/components/TawkToChat';

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getStartedPath = user ? '/app' : '/auth';

  const handleSupportClick = () => {
    showTawkToChat();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-app-light-blue to-white flex flex-col">
      <nav className="container mx-auto py-6 px-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-app-blue" />
          <span className="text-xl font-bold text-app-blue">Smart Cart Buddy</span>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-app-blue text-app-blue hover:bg-app-blue/10 rounded-full"
            onClick={handleSupportClick}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Support
          </Button>
          <Link to={getStartedPath}>
            <Button className="bg-app-blue hover:bg-app-blue/90 text-white rounded-full">
              {user ? 'Go to App' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <button 
          className="md:hidden text-app-blue p-2 focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white shadow-lg z-40 p-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full border-app-blue text-app-blue hover:bg-app-blue/10 rounded-full"
              onClick={handleSupportClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Support
            </Button>
            <Link to={getStartedPath} className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-app-blue hover:bg-app-blue/90 text-white rounded-full">
                {user ? 'Go to App' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <section className="container mx-auto px-4 py-12 md:py-20 flex-1 flex flex-col md:flex-row items-center justify-center mt-4 md:mt-0">
        <div className="md:w-1/2 space-y-5 md:space-y-6 text-center md:text-left">
          <div className="inline-block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-app-blue font-medium">Grocery Shopping Made Simple</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-800 leading-tight">
            Smart <span className="text-app-blue">Shopping</span> Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto md:mx-0">
            Manage your grocery lists effortlessly, extract ingredients from recipes, and shop smarter.
            Our app makes grocery shopping and meal planning easier than ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Link to={getStartedPath} className="w-full sm:w-auto">
              <Button 
                className="bg-app-blue hover:bg-app-blue/90 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl text-lg w-full"
              >
                {user ? 'Go to App' : 'Try for Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center relative">
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-app-light-blue/60 rounded-full flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1543168256-418811576931?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Smart shopping cart in supermarket" 
              className="w-[250px] md:w-[400px] h-auto object-contain rounded-2xl animate-float drop-shadow-xl"
            />
            
            <img 
              src="https://images.unsplash.com/photo-1628102491629-778571d893a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1980&q=80" 
              alt="Grocery shopping bag with fresh vegetables" 
              className="hidden sm:block absolute -bottom-16 -left-16 w-[150px] md:w-[250px] h-[150px] md:h-[250px] object-cover rounded-2xl rotate-12 animate-float animation-delay-700 drop-shadow-xl border-4 border-white"
            />
            
            <div className="absolute -right-6 md:-right-10 top-6 md:top-10 bg-app-blue text-white text-sm md:text-lg font-bold px-3 md:px-6 py-2 md:py-3 rounded-full rotate-12">
              Special Offer
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
            Why Choose <span className="text-app-blue">Smart Cart Buddy</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-app-light-blue/30 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="bg-app-blue/10 p-3 rounded-full w-fit mb-4">
                <ShoppingCart className="h-6 w-6 text-app-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Lists</h3>
              <p className="text-gray-600">
                Create and organize your shopping lists with intelligent categorization and sorting.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-app-light-blue/30 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="bg-app-blue/10 p-3 rounded-full w-fit mb-4">
                <ShoppingCart className="h-6 w-6 text-app-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recipe Integration</h3>
              <p className="text-gray-600">
                Extract ingredients from any recipe and add them directly to your shopping list.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-app-light-blue/30 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="bg-app-blue/10 p-3 rounded-full w-fit mb-4">
                <ShoppingCart className="h-6 w-6 text-app-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Budget Tracking</h3>
              <p className="text-gray-600">
                Keep track of your grocery expenses and stay within your shopping budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-app-blue to-blue-400 py-12 md:py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Ready to Simplify Your Grocery Shopping?</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of happy users who have transformed their grocery shopping experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              className="border-white bg-white text-app-blue hover:bg-white/90 hover:text-app-blue/90 px-4 sm:px-8 py-4 sm:py-6 rounded-xl text-base md:text-lg"
              onClick={handleSupportClick}
            >
              <MessageCircle className="mr-2 h-5 w-5 text-app-blue" />
              Contact Support
            </Button>
            <Link to={getStartedPath}>
              <Button 
                className="bg-white text-app-blue hover:bg-gray-100 px-4 sm:px-8 py-4 sm:py-6 rounded-xl text-base md:text-lg font-semibold w-full"
              >
                {user ? 'Go to App' : 'Get Started Now'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-lg font-bold">Smart Cart Buddy</span>
          </div>
          <p className="text-gray-400 mb-4">
            © {new Date().getFullYear()} Smart Cart Buddy. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white hover:bg-transparent text-sm"
              onClick={handleSupportClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Need help? Chat with support
            </Button>
            <a 
              href="mailto:Babatundeadeoyeak@gmail.com" 
              className="flex items-center"
            >
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-white hover:bg-transparent text-sm"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
