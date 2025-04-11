
import React from 'react';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-app-light-blue to-white flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto py-6 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-app-blue" />
          <span className="text-xl font-bold text-app-blue">Smart Cart Buddy</span>
        </div>
        <Link to="/auth">
          <Button className="bg-app-blue hover:bg-app-blue/90 text-white rounded-full">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex-1 flex flex-col md:flex-row items-center justify-center">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-app-blue font-medium">Grocery Shopping Made Simple</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 leading-tight">
            Smart <span className="text-app-blue">Shopping</span> Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Manage your grocery lists effortlessly, extract ingredients from recipes, and shop smarter.
            Our app makes grocery shopping and meal planning easier than ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/auth">
              <Button 
                className="bg-app-blue hover:bg-app-blue/90 text-white px-8 py-6 rounded-xl text-lg w-full"
              >
                Try for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
          <div className="relative w-[350px] h-[350px] bg-app-light-blue/60 rounded-full flex items-center justify-center">
            <img 
              src="/placeholder.svg" 
              alt="Smart Cart Buddy App" 
              className="w-[300px] h-auto object-contain animate-float"
            />
            <div className="absolute -right-10 top-10 bg-app-blue text-white text-lg font-bold px-6 py-3 rounded-full rotate-12">
              Special Offer
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose <span className="text-app-blue">Smart Cart Buddy</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-app-light-blue/30 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="bg-app-blue/10 p-3 rounded-full w-fit mb-4">
                <ShoppingCart className="h-6 w-6 text-app-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Lists</h3>
              <p className="text-gray-600">
                Create and organize your shopping lists with intelligent categorization and sorting.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-app-light-blue/30 to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="bg-app-blue/10 p-3 rounded-full w-fit mb-4">
                <ShoppingCart className="h-6 w-6 text-app-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recipe Integration</h3>
              <p className="text-gray-600">
                Extract ingredients from any recipe and add them directly to your shopping list.
              </p>
            </div>
            
            {/* Feature 3 */}
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-app-blue to-blue-400 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Simplify Your Grocery Shopping?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of happy users who have transformed their grocery shopping experience.
          </p>
          <Link to="/auth">
            <Button 
              className="bg-white text-app-blue hover:bg-gray-100 px-8 py-6 rounded-xl text-lg font-semibold"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
