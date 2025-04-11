
import React from 'react';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-app-light-green to-white flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto py-6 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-app-green" />
          <span className="text-xl font-bold text-app-green">Smart Cart Buddy</span>
        </div>
        <Link to="/auth">
          <Button className="bg-app-green hover:bg-app-green/90 text-white rounded-full">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex-1 flex flex-col md:flex-row items-center justify-center">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-app-green font-medium">Grocery Shopping Made Simple</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 leading-tight">
            Smart <span className="text-app-green">Shopping</span> Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Manage your grocery lists effortlessly, extract ingredients from recipes, and shop smarter.
            Our app makes grocery shopping and meal planning easier than ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/auth">
              <Button className="bg-app-green hover:bg-app-green/90 text-white px-8 py-6 rounded-xl text-lg">
                Try for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
          <div className="relative w-[350px] h-[350px] bg-app-light-blue rounded-full flex items-center justify-center">
            <img 
              src="/placeholder.svg" 
              alt="Smart Cart Buddy App" 
              className="w-[300px] h-auto object-contain animate-float"
            />
            <div className="absolute -right-10 top-10 bg-app-green text-white text-lg font-bold px-6 py-3 rounded-full rotate-12">
              Special Offer
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-lg font-bold">Smart Cart Buddy</span>
          </div>
          <p className="text-gray-400">
            © {new Date().getFullYear()} Smart Cart Buddy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
