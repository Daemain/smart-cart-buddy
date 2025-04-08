
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeText } = await req.json();
    
    if (!recipeText || recipeText.trim() === '') {
      return new Response(JSON.stringify({ error: 'Recipe text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing food or recipe:', recipeText.substring(0, 100) + '...');

    // Call OpenAI API with improved prompt that handles both recipe text and food names
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional chef assistant. Your task is to analyze the input and respond accordingly:\n\n' +
                     '1. If the input is a recipe (containing multiple ingredients and instructions), extract ONLY the ingredients with their quantities.\n\n' +
                     '2. If the input is a dish or food name (like "Egusi", "Lasagna", "Apple Pie"), list the typical ingredients needed to make this dish with their approximate quantities.\n\n' +
                     'Format your response as a JSON array of objects with "name" and "quantity" properties. For example:\n' +
                     '[{"name": "flour", "quantity": "2 cups"}, {"name": "sugar", "quantity": "1 tbsp"}]\n\n' +
                     'Make sure to generate a comprehensive list of ingredients for any food name provided. Do not include recipe instructions, steps, or any other information. Only return a valid JSON array.'
          },
          { role: 'user', content: recipeText }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ error: `OpenAI API error: ${errorData.error?.message || response.statusText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    const ingredientsText = data.choices[0].message.content;
    console.log('OpenAI response:', ingredientsText);
    
    // Parse the ingredients JSON
    let ingredients;
    try {
      // Try to parse the JSON directly
      ingredients = JSON.parse(ingredientsText);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      // If direct parsing fails, try to extract JSON from text
      const jsonMatch = ingredientsText.match(/\[(.|\n)*\]/);
      if (jsonMatch) {
        try {
          ingredients = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse JSON from regex match:', e2);
        }
      }
      
      // If no valid JSON found, try a last resort simple parsing approach
      if (!ingredients) {
        ingredients = generateDefaultIngredients(recipeText);
      }
    }

    // Additional validation to ensure we have an array of objects with name and quantity
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      console.log('Invalid ingredients format or empty array, using default generator');
      ingredients = generateDefaultIngredients(recipeText);
    }

    // Make sure each ingredient has the required properties
    ingredients = ingredients.map(item => ({
      name: typeof item.name === 'string' ? item.name.trim() : 'Unknown ingredient',
      quantity: typeof item.quantity === 'string' ? item.quantity.trim() : ''
    }));

    console.log('Final extracted ingredients:', JSON.stringify(ingredients));
    
    return new Response(JSON.stringify({ ingredients }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting ingredients:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate default ingredients for a food item if OpenAI fails
function generateDefaultIngredients(foodName) {
  console.log('Generating default ingredients for:', foodName);
  
  // Some common defaults based on food types
  const foodName_lower = foodName.toLowerCase().trim();
  
  // Simple dictionary of common foods and their ingredients
  const commonFoods = {
    'egusi': [
      {name: 'Egusi seeds (melon seeds)', quantity: '2 cups'},
      {name: 'Palm oil', quantity: '1/2 cup'},
      {name: 'Spinach or bitter leaf', quantity: '2 cups, chopped'},
      {name: 'Onions', quantity: '1 medium, chopped'},
      {name: 'Meat or fish', quantity: '1 lb'},
      {name: 'Pepper', quantity: 'to taste'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Stock cubes', quantity: '2'}
    ],
    'jollof rice': [
      {name: 'Rice', quantity: '2 cups'},
      {name: 'Tomatoes', quantity: '4 medium'},
      {name: 'Onions', quantity: '2 medium'},
      {name: 'Bell peppers', quantity: '1'},
      {name: 'Vegetable oil', quantity: '1/4 cup'},
      {name: 'Curry powder', quantity: '1 tbsp'},
      {name: 'Thyme', quantity: '1 tsp'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Stock cubes', quantity: '2'}
    ],
    'lasagna': [
      {name: 'Lasagna noodles', quantity: '12 sheets'},
      {name: 'Ground beef', quantity: '1 lb'},
      {name: 'Onion', quantity: '1 medium, chopped'},
      {name: 'Garlic', quantity: '2 cloves, minced'},
      {name: 'Tomato sauce', quantity: '24 oz'},
      {name: 'Ricotta cheese', quantity: '15 oz'},
      {name: 'Mozzarella cheese', quantity: '16 oz, shredded'},
      {name: 'Parmesan cheese', quantity: '1/2 cup, grated'},
      {name: 'Egg', quantity: '1'},
      {name: 'Italian seasoning', quantity: '2 tsp'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Black pepper', quantity: 'to taste'}
    ]
  };
  
  // Check if we have default ingredients for this food
  for (const [food, ingredients] of Object.entries(commonFoods)) {
    if (foodName_lower.includes(food)) {
      return ingredients;
    }
  }
  
  // Generic return for unknown food
  return [
    {name: foodName, quantity: 'As needed'},
    {name: 'Salt', quantity: 'To taste'},
    {name: 'Pepper', quantity: 'To taste'}
  ];
}
