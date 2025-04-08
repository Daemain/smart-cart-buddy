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
    const { recipeText, imageBase64, userDescription } = await req.json();
    
    // Check if we have either image with description or text input
    if (!imageBase64 && (!recipeText || recipeText.trim() === '')) {
      return new Response(JSON.stringify({ error: 'Either an image or recipe text is required' }), {
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

    let ingredients;
    
    // Prioritize image-based extraction if available
    if (imageBase64) {
      console.log('Processing image with description:', userDescription ? userDescription.substring(0, 100) + '...' : 'No description provided');
      try {
        // Enhanced image extraction with more specific system prompt
        ingredients = await extractIngredientsFromImageWithOpenAI(imageBase64, userDescription || '');
        console.log('Successfully extracted ingredients from image with OpenAI:', JSON.stringify(ingredients));
      } catch (aiError) {
        console.error('OpenAI image extraction failed:', aiError);
        // Fallback only if we have a description
        if (userDescription) {
          try {
            console.log('Attempting fallback to text extraction using description');
            ingredients = await extractIngredientsWithOpenAI(userDescription);
            console.log('Fallback to text extraction successful:', JSON.stringify(ingredients));
          } catch (textError) {
            console.error('Text fallback also failed:', textError);
            ingredients = generateDefaultIngredients(userDescription);
            console.log('Using fallback ingredients:', JSON.stringify(ingredients));
          }
        } else {
          console.log('No description provided for fallback, using generic fallback');
          ingredients = generateDefaultIngredients('Food dish');
          console.log('Using generic fallback ingredients:', JSON.stringify(ingredients));
        }
      }
    }
    // Use text-based extraction as backup only
    else if (recipeText) {
      console.log('No image available, processing recipe text:', recipeText.substring(0, 100) + '...');
      try {
        ingredients = await extractIngredientsWithOpenAI(recipeText);
        console.log('Successfully extracted ingredients with OpenAI:', JSON.stringify(ingredients));
      } catch (aiError) {
        console.error('OpenAI text extraction failed:', aiError);
        ingredients = generateDefaultIngredients(recipeText);
        console.log('Using fallback ingredients:', JSON.stringify(ingredients));
      }
    }
    
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

async function extractIngredientsFromImageWithOpenAI(imageBase64, userDescription) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are a professional culinary image analyzer with expertise in identifying food ingredients from images. Your task is to:

1. Analyze the image carefully to identify ALL visible ingredients
2. Infer additional ingredients that would typically be in the dish but might not be visible
3. Consider the user's description as supplementary information only
4. Be specific about quantities where possible, or provide reasonable estimates based on standard recipes
5. Format your response as a VALID JSON ARRAY of objects with "name" and "quantity" properties
   Example: [{"name": "flour", "quantity": "2 cups"}, {"name": "sugar", "quantity": "1 tbsp"}]

Important guidelines:
- Focus primarily on what you can see in the image
- Be comprehensive - include ALL ingredients you can identify in the image
- For traditional dishes, include authentic ingredients based on what's visible
- Avoid generic assumptions unless clearly supported by the image
- ONLY return valid JSON without any additional text or explanations`
        },
        { 
          role: 'user', 
          content: [
            { 
              type: 'text', 
              text: userDescription ? `Here's a food image. Additional context: ${userDescription}` : "Here's a food image. Please identify all the ingredients visible in this image."
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic output
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  const ingredientsText = data.choices[0].message.content;
  console.log('Raw OpenAI image analysis response:', ingredientsText);
  
  // Parse the ingredients JSON
  try {
    // Try to parse the JSON directly
    const parsed = JSON.parse(ingredientsText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (e) {
    console.error('Failed to parse OpenAI response as JSON:', e);
    // Try to extract JSON from text
    const jsonMatch = ingredientsText.match(/\[(.|\n)*\]/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extracted) && extracted.length > 0) {
          return extracted;
        }
      } catch (e2) {
        console.error('Failed to parse JSON from regex match:', e2);
      }
    }
    throw new Error('Could not parse ingredients from AI response');
  }
}

async function extractIngredientsWithOpenAI(recipeText) {
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
          content: `You are a professional chef specializing in global cuisine. Your task is to:

1. If given a FOOD NAME (like "Egusi", "Lasagna", "Spaghetti Carbonara"), provide a DETAILED list of ALL ingredients typically needed to make this dish with appropriate quantities.

2. If given a RECIPE TEXT with instructions, extract ONLY the ingredients with their quantities.

In both cases, format your response as a VALID JSON ARRAY of objects with "name" and "quantity" properties. Example:
[{"name": "flour", "quantity": "2 cups"}, {"name": "sugar", "quantity": "1 tbsp"}]

BE COMPREHENSIVE - provide ALL typical ingredients for the dish, not just the main ingredient.
For traditional dishes, include ALL authentic ingredients.
ONLY return valid JSON without any additional text.`
        },
        { role: 'user', content: recipeText }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  const ingredientsText = data.choices[0].message.content;
  console.log('Raw OpenAI response:', ingredientsText);
  
  // Parse the ingredients JSON
  try {
    // Try to parse the JSON directly
    const parsed = JSON.parse(ingredientsText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (e) {
    console.error('Failed to parse OpenAI response as JSON:', e);
    // Try to extract JSON from text
    const jsonMatch = ingredientsText.match(/\[(.|\n)*\]/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extracted) && extracted.length > 0) {
          return extracted;
        }
      } catch (e2) {
        console.error('Failed to parse JSON from regex match:', e2);
      }
    }
    throw new Error('Could not parse ingredients from AI response');
  }
}

function generateDefaultIngredients(foodName) {
  console.log('Generating default ingredients for:', foodName);
  
  const foodName_lower = foodName.toLowerCase().trim();
  
  // Expanded dictionary of common foods and their ingredients
  const commonFoods = {
    'egusi': [
      {name: 'Egusi seeds (melon seeds)', quantity: '2 cups'},
      {name: 'Palm oil', quantity: '1/2 cup'},
      {name: 'Spinach or bitter leaf', quantity: '2 cups, chopped'},
      {name: 'Onions', quantity: '1 medium, chopped'},
      {name: 'Tomatoes', quantity: '3 medium, chopped'},
      {name: 'Peppers', quantity: '2, chopped'},
      {name: 'Meat or fish', quantity: '1 lb'},
      {name: 'Stock cubes', quantity: '2'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Crayfish', quantity: '2 tablespoons, ground'},
      {name: 'Garlic', quantity: '2 cloves, minced'},
      {name: 'Ginger', quantity: '1 tablespoon, minced'}
    ],
    'jollof rice': [
      {name: 'Long grain rice', quantity: '2 cups'},
      {name: 'Tomatoes', quantity: '6 medium'},
      {name: 'Red bell peppers', quantity: '2 medium'},
      {name: 'Scotch bonnet/habanero peppers', quantity: '1-2 (adjust for heat)'},
      {name: 'Onions', quantity: '2 large'},
      {name: 'Vegetable oil', quantity: '1/4 cup'},
      {name: 'Tomato paste', quantity: '2 tablespoons'},
      {name: 'Curry powder', quantity: '1 tablespoon'},
      {name: 'Dried thyme', quantity: '1 teaspoon'},
      {name: 'Bay leaves', quantity: '2'},
      {name: 'Garlic', quantity: '3 cloves, minced'},
      {name: 'Ginger', quantity: '1 inch piece, grated'},
      {name: 'Chicken or vegetable stock', quantity: '3 cups'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Stock cubes', quantity: '2'}
    ],
    'lasagna': [
      {name: 'Lasagna noodles', quantity: '12 sheets'},
      {name: 'Ground beef', quantity: '1 lb'},
      {name: 'Italian sausage', quantity: '1/2 lb'},
      {name: 'Onion', quantity: '1 large, chopped'},
      {name: 'Garlic', quantity: '3 cloves, minced'},
      {name: 'Tomato sauce', quantity: '24 oz'},
      {name: 'Tomato paste', quantity: '2 tablespoons'},
      {name: 'Crushed tomatoes', quantity: '14 oz can'},
      {name: 'Ricotta cheese', quantity: '15 oz'},
      {name: 'Mozzarella cheese', quantity: '16 oz, shredded'},
      {name: 'Parmesan cheese', quantity: '1/2 cup, grated'},
      {name: 'Eggs', quantity: '1'},
      {name: 'Fresh basil', quantity: '1/4 cup, chopped'},
      {name: 'Dried oregano', quantity: '1 tablespoon'},
      {name: 'Italian seasoning', quantity: '1 tablespoon'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Black pepper', quantity: 'to taste'},
      {name: 'Olive oil', quantity: '2 tablespoons'}
    ],
    'pancakes': [
      {name: 'All-purpose flour', quantity: '1 1/2 cups'},
      {name: 'Baking powder', quantity: '3 1/2 teaspoons'},
      {name: 'Salt', quantity: '1 teaspoon'},
      {name: 'Sugar', quantity: '1 tablespoon'},
      {name: 'Milk', quantity: '1 1/4 cups'},
      {name: 'Egg', quantity: '1'},
      {name: 'Butter', quantity: '3 tablespoons, melted'},
      {name: 'Vanilla extract', quantity: '1 teaspoon'}
    ],
    'fried rice': [
      {name: 'Cooked rice (preferably day-old)', quantity: '3 cups'},
      {name: 'Vegetable oil', quantity: '3 tablespoons'},
      {name: 'Eggs', quantity: '2, beaten'},
      {name: 'Carrots', quantity: '1/2 cup, diced'},
      {name: 'Peas', quantity: '1/2 cup'},
      {name: 'Onion', quantity: '1 small, chopped'},
      {name: 'Garlic', quantity: '2 cloves, minced'},
      {name: 'Green onions', quantity: '3, chopped'},
      {name: 'Soy sauce', quantity: '3 tablespoons'},
      {name: 'Sesame oil', quantity: '1 teaspoon'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Black pepper', quantity: 'to taste'},
      {name: 'Protein (chicken, shrimp, etc.)', quantity: '1 cup, cooked and diced'}
    ],
    'spaghetti carbonara': [
      {name: 'Spaghetti', quantity: '1 lb'},
      {name: 'Pancetta or bacon', quantity: '8 oz, diced'},
      {name: 'Eggs', quantity: '4 large'},
      {name: 'Parmesan cheese', quantity: '1 cup, grated'},
      {name: 'Pecorino Romano cheese', quantity: '1/2 cup, grated'},
      {name: 'Black pepper', quantity: '1 teaspoon, freshly ground'},
      {name: 'Garlic', quantity: '2 cloves, minced (optional)'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Olive oil', quantity: '1 tablespoon'}
    ],
    'pizza': [
      {name: 'Pizza dough', quantity: '1 lb'},
      {name: 'Tomato sauce', quantity: '1 cup'},
      {name: 'Mozzarella cheese', quantity: '2 cups, shredded'},
      {name: 'Parmesan cheese', quantity: '1/4 cup, grated'},
      {name: 'Olive oil', quantity: '2 tablespoons'},
      {name: 'Garlic', quantity: '2 cloves, minced'},
      {name: 'Dried oregano', quantity: '1 teaspoon'},
      {name: 'Salt', quantity: 'to taste'},
      {name: 'Black pepper', quantity: 'to taste'},
      {name: 'Toppings (pepperoni, mushrooms, etc.)', quantity: 'as desired'}
    ]
  };
  
  // Check for partial matches in food names
  for (const [food, ingredients] of Object.entries(commonFoods)) {
    if (foodName_lower.includes(food) || food.includes(foodName_lower)) {
      return ingredients;
    }
  }
  
  // More generic fallback for unknown food types
  return [
    {name: foodName, quantity: 'As needed'},
    {name: 'Salt', quantity: 'To taste'},
    {name: 'Pepper', quantity: 'To taste'},
    {name: 'Onion', quantity: '1 medium'},
    {name: 'Garlic', quantity: '2 cloves'},
    {name: 'Vegetable oil', quantity: '2 tablespoons'},
    {name: 'Water or stock', quantity: '1 cup'}
  ];
}
