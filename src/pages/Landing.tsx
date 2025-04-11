
import React from 'react';
import { ArrowRight, CheckCircle2, ShoppingCart, ListChecks, Utensils } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-app-light-green to-white">
      {/* Navigation */}
      <nav className="container mx-auto py-6 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-app-green" />
          <span className="text-xl font-bold text-app-green">Smart Cart Buddy</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-700 hover:text-app-green transition-colors">Features</a>
          <a href="#pricing" className="text-gray-700 hover:text-app-green transition-colors">Pricing</a>
          <a href="#about" className="text-gray-700 hover:text-app-green transition-colors">About Us</a>
        </div>
        <Link to="/auth">
          <Button className="bg-app-green hover:bg-app-green/90 text-white rounded-full">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-6">
          <div className="inline-block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-app-green font-medium">Grocery Shopping Made Simple</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 leading-tight">
            Smart <span className="text-app-green">Shopping</span> Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Manage your grocery lists effortlessly, extract ingredients from recipes, and shop smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button className="bg-app-green hover:bg-app-green/90 text-white px-8 py-6 rounded-xl text-lg">
                Try for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="border-app-green text-app-green hover:bg-app-green/10 px-8 py-6 rounded-xl text-lg">
                Learn More
              </Button>
            </a>
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

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Smart Cart Buddy?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our app makes grocery shopping and meal planning easier than ever
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingCart className="h-12 w-12 text-app-green" />,
                title: "Smart Shopping Lists",
                description: "Create, organize, and share your grocery lists effortlessly"
              },
              {
                icon: <Utensils className="h-12 w-12 text-app-green" />,
                title: "Recipe Integration",
                description: "Extract ingredients from any recipe with one click"
              },
              {
                icon: <ListChecks className="h-12 w-12 text-app-green" />,
                title: "Shopping History",
                description: "Track your purchases and optimize your shopping habits"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="mb-6 p-4 bg-app-light-green rounded-full">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-app-light-blue/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Pricing Plans</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Basic",
                price: "Free",
                period: "Forever",
                description: "Perfect for getting started",
                features: ["Basic grocery lists", "Up to 10 items per list", "1 active list"],
                buttonText: "Start Free",
                popular: false
              },
              {
                name: "Premium",
                price: "$4.99",
                period: "per month",
                description: "Most popular choice",
                features: ["Unlimited grocery lists", "Recipe extraction", "Shopping history", "Smart suggestions"],
                buttonText: "Go Premium",
                popular: true
              },
              {
                name: "Family",
                price: "$9.99",
                period: "per month",
                description: "For the whole household",
                features: ["Everything in Premium", "Up to 5 user accounts", "Shared lists", "Family meal planning"],
                buttonText: "Get Family Plan",
                popular: false
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`border-0 hover:shadow-lg transition-all relative ${
                  plan.popular ? 'shadow-xl scale-105 border-b-4 border-b-app-green' : 'shadow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-app-green text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardContent className={`p-8 ${plan.popular ? 'pt-10' : 'pt-6'}`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-app-green mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button 
                      className={`w-full py-6 ${
                        plan.popular 
                          ? 'bg-app-green hover:bg-app-green/90 text-white' 
                          : 'bg-white border border-app-green text-app-green hover:bg-app-green/10'
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">About Smart Cart Buddy</h2>
            <p className="text-lg text-gray-600 mb-8">
              Smart Cart Buddy was created by a team of grocery shopping enthusiasts who wanted 
              to make the weekly shopping experience more efficient and enjoyable. Our mission 
              is to save you time and money while reducing food waste.
            </p>
            <p className="text-lg text-gray-600 mb-10">
              Started in 2023, we've helped thousands of users simplify their grocery shopping 
              and meal planning process.
            </p>
            <Link to="/auth">
              <Button className="bg-app-green hover:bg-app-green/90 text-white px-8 py-6 rounded-xl text-lg">
                Join Us Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-6 w-6" />
                <span className="text-lg font-bold">Smart Cart Buddy</span>
              </div>
              <p className="text-gray-400">
                Making grocery shopping simple and efficient.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Contact</h4>
              <p className="text-gray-400 mb-2">Need help? Get in touch with us</p>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Support
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Smart Cart Buddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
