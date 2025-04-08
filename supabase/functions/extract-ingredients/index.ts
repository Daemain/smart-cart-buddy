
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
      throw new Error('Recipe text is required');
    }

    // Call OpenAI API with improved prompt
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
            content: 'You are an expert chef tasked with extracting ingredients from recipe text. Extract ONLY the ingredients (not the recipe title, steps, or instructions) and format them as a JSON array of objects with "name" and "quantity" properties. For example: [{"name": "flour", "quantity": "2 cups"}, {"name": "sugar", "quantity": "1 tbsp"}]. Only return the JSON array. Do not include any explanatory text.'
          },
          { role: 'user', content: recipeText }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const ingredientsText = data.choices[0].message.content;
    
    // Parse the ingredients JSON
    let ingredients;
    try {
      // Try to parse the JSON directly
      ingredients = JSON.parse(ingredientsText);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from text
      const jsonMatch = ingredientsText.match(/\[(.|\n)*\]/);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
      } else {
        // If no valid JSON found, try a last resort simple parsing approach
        const fallbackIngredients = parseIngredientsFallback(recipeText);
        if (fallbackIngredients.length > 0) {
          ingredients = fallbackIngredients;
        } else {
          throw new Error('Failed to parse ingredients from AI response');
        }
      }
    }

    // Additional validation to ensure we have an array of objects with name and quantity
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      const fallbackIngredients = parseIngredientsFallback(recipeText);
      if (fallbackIngredients.length > 0) {
        ingredients = fallbackIngredients;
      } else {
        throw new Error('Invalid ingredients format returned');
      }
    }

    // Make sure each ingredient has the required properties
    ingredients = ingredients.map(item => ({
      name: typeof item.name === 'string' ? item.name : 'Unknown ingredient',
      quantity: typeof item.quantity === 'string' ? item.quantity : ''
    }));

    console.log('Extracted ingredients:', JSON.stringify(ingredients));
    
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

// Fallback parsing function if OpenAI fails
function parseIngredientsFallback(text) {
  const lines = text.split('\n');
  const ingredients = [];
  
  const measurementUnits = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 
    'tsp', 'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces',
    'pound', 'pounds', 'lb', 'lbs', 'g', 'gram', 'grams',
    'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters',
    'l', 'liter', 'liters', 'pinch', 'dash', 'to taste'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('Step') || trimmedLine.startsWith('Instruction')) continue;
    
    // Skip lines that look like headers, titles or instructions
    if (trimmedLine.endsWith(':') || 
        /^(Step|Instruction|Direction|Method|Preparation|Cook|Bake|Serves|Yield)s?\b/i.test(trimmedLine)) {
      continue;
    }
    
    // Check if line contains measurement units or starts with a number
    const hasUnit = measurementUnits.some(unit => trimmedLine.toLowerCase().includes(unit));
    const startsWithNumber = /^\d/.test(trimmedLine);
    
    if (hasUnit || startsWithNumber) {
      // Try to separate quantity from name
      const match = trimmedLine.match(/^([\d\/\.\s]+)?\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|pound|pounds|lb|lbs|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|pinch|dash|to taste)s?\s+(?:of\s+)?(.+)$/i);
      
      if (match) {
        const quantity = `${match[1] || ''} ${match[2] || ''}`.trim();
        const name = match[3].trim();
        ingredients.push({ name, quantity });
      } else {
        // If no specific match pattern, try to split on first space after a number
        const numberMatch = trimmedLine.match(/^([\d\/\.\s]+(?:\s*[-–—]\s*[\d\/\.\s]+)?)\s+(.+)$/);
        if (numberMatch) {
          ingredients.push({
            name: numberMatch[2].trim(),
            quantity: numberMatch[1].trim()
          });
        } else {
          // Last resort: treat the whole line as an ingredient name
          ingredients.push({
            name: trimmedLine,
            quantity: ''
          });
        }
      }
    } else if (trimmedLine.length > 2) {
      // If line doesn't have units but looks like an ingredient
      ingredients.push({
        name: trimmedLine,
        quantity: ''
      });
    }
  }
  
  return ingredients;
}
