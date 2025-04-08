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
        // Enhanced image extraction with more specific and detailed prompt
        ingredients = await extractIngredientsFromImageWithOpenAI(imageBase64, userDescription || '');
        console.log('Successfully extracted ingredients from image with OpenAI:', JSON.stringify(ingredients));
      } catch (aiError) {
        console.error('OpenAI image extraction failed:', aiError);
        return new Response(JSON.stringify({ error: 'Failed to analyze image. The OpenAI vision API might be experiencing issues.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
        return new Response(JSON.stringify({ error: 'Failed to analyze recipe text. Try with an image instead.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (!ingredients || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: 'No ingredients could be identified. Try a clearer image or more detailed description.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
  console.log('Sending image to OpenAI vision API with description:', userDescription.substring(0, 50));
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        { 
          role: 'system', 
          content: `You are a professional food scientist who specializes in identifying ingredients from food images with extreme precision.

CRITICAL INSTRUCTIONS:
1. ONLY identify ingredients that are PHYSICALLY VISIBLE in the image
2. DO NOT provide a generic recipe for the dish - this is NOT what you are being asked to do
3. DO NOT make assumptions about invisible ingredients
4. BE SPECIFIC about ingredient varieties (e.g., "jasmine rice" not just "rice" if you can tell)
5. Include colors, textures, and specific varieties when visible
6. If you can see quantities, mention them
7. If you cannot identify something with confidence, say "unidentified [color/texture] ingredient"
8. DO NOT try to guess the name of the dish and then list its typical ingredients
9. FOCUS EXCLUSIVELY on what is physically visible in this specific image

FORMAT YOUR RESPONSE AS A JSON ARRAY OF OBJECTS with "name" and "quantity" properties. 
Do not include ANY text outside of the JSON structure.
Example: [{"name": "diced tomatoes", "quantity": "about 1 cup"}, {"name": "green bell pepper slices", "quantity": "5-6 slices"}]

IMPORTANT: If the image is unclear or you cannot identify specific ingredients clearly, DO NOT resort to listing generic recipe ingredients - respond honestly with the few ingredients you can actually see or state that you cannot identify ingredients clearly.`
        },
        { 
          role: 'user', 
          content: [
            { 
              type: 'text', 
              text: userDescription ? 
                 `Analyze this food image and list ONLY the ingredients you can physically see in the image. 
                  For context only (DO NOT use this to guess invisible ingredients): The food might be ${userDescription}.
                  Again, ONLY list ingredients you can actually SEE in the image, not a generic recipe.` 
                : "Analyze this food image and list ONLY the ingredients you can physically see in the image. DO NOT provide a generic recipe."
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
    console.error('OpenAI API error response:', errorData);
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
  console.log('Note: No longer using default ingredients fallbacks');
  return [];
}
