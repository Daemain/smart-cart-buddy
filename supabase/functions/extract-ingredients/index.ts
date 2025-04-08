
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleCloudApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');

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

    let ingredients;
    let analysisMethod = '';
    
    // Prioritize image-based extraction if available
    if (imageBase64) {
      console.log('Processing image with description:', userDescription ? userDescription.substring(0, 100) + '...' : 'No description provided');
      
      // Try OpenAI first - if API key is available
      if (openAIApiKey) {
        try {
          ingredients = await extractIngredientsFromImageWithOpenAI(imageBase64, userDescription || '');
          console.log('Successfully extracted ingredients from image with OpenAI:', JSON.stringify(ingredients));
          analysisMethod = 'openai';
        } catch (aiError) {
          console.error('OpenAI image extraction failed:', aiError);
          
          // If OpenAI fails and Google Cloud Vision is available, try that next
          if (googleCloudApiKey) {
            try {
              console.log('Falling back to Google Cloud Vision API for image analysis...');
              ingredients = await extractIngredientsWithGoogleVision(imageBase64, userDescription || '');
              console.log('Successfully extracted ingredients with Google Vision:', JSON.stringify(ingredients));
              analysisMethod = 'google';
            } catch (googleError) {
              console.error('Google Vision extraction failed:', googleError);
              return new Response(JSON.stringify({ 
                error: 'Failed to analyze image with both OpenAI and Google Vision. Please try again with a clearer image or use text input.',
                details: googleError.message
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } else {
            // No Google fallback available
            // Check if it's a quota error
            if (aiError.message && aiError.message.includes('quota')) {
              return new Response(JSON.stringify({ 
                error: 'OpenAI API quota exceeded. Please try again later or try the text-based extraction instead.',
                isQuotaError: true 
              }), {
                status: 429, // Too Many Requests
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } else {
              return new Response(JSON.stringify({ error: 'Failed to analyze image. Please try again with a clearer image or use text input.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }
      } 
      // If no OpenAI key but Google Cloud Vision is available
      else if (googleCloudApiKey) {
        try {
          console.log('No OpenAI API key available, using Google Cloud Vision API for image analysis...');
          ingredients = await extractIngredientsWithGoogleVision(imageBase64, userDescription || '');
          console.log('Successfully extracted ingredients with Google Vision:', JSON.stringify(ingredients));
          analysisMethod = 'google';
        } catch (googleError) {
          console.error('Google Vision extraction failed:', googleError);
          return new Response(JSON.stringify({ 
            error: 'Failed to analyze image with Google Vision. Please try again with a clearer image or use text input.',
            details: googleError.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: 'No image analysis API keys configured. Please configure either OpenAI or Google Cloud Vision API.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    // Use text-based extraction if no image or as fallback
    else if (recipeText) {
      console.log('No image available, processing recipe text:', recipeText.substring(0, 100) + '...');
      try {
        if (openAIApiKey) {
          ingredients = await extractIngredientsWithOpenAI(recipeText);
          console.log('Successfully extracted ingredients with OpenAI:', JSON.stringify(ingredients));
          analysisMethod = 'openai-text';
        } else {
          return new Response(JSON.stringify({ error: 'OpenAI API key not configured for text extraction.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (aiError) {
        console.error('OpenAI text extraction failed:', aiError);
        
        // Check if it's a quota error
        if (aiError.message && aiError.message.includes('quota')) {
          return new Response(JSON.stringify({ 
            error: 'OpenAI API quota exceeded. Please try again later.',
            isQuotaError: true 
          }), {
            status: 429, // Too Many Requests
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ error: 'Failed to analyze recipe text. Try with an image instead.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    if (!ingredients || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: 'No ingredients could be identified. Try a clearer image or more detailed description.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ ingredients, analysisMethod }), {
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
  
  try {
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
  } catch (error) {
    // Add more details to the error for better debugging
    console.error('Error in extractIngredientsFromImageWithOpenAI:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

async function extractIngredientsWithGoogleVision(imageBase64, userDescription) {
  console.log('Sending image to Google Cloud Vision API with description:', userDescription.substring(0, 50));

  try {
    // Step 1: Analyze the image with Google Cloud Vision API
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 15
              },
              {
                type: 'TEXT_DETECTION',
                maxResults: 10
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 15
              }
            ]
          }
        ]
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error('Google Vision API error response:', errorData);
      throw new Error(`Google Vision API error: ${errorData.error?.message || visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    
    console.log('Google Vision API response:', JSON.stringify(visionData));
    
    if (!visionData.responses || !visionData.responses[0]) {
      throw new Error('Empty response from Google Vision API');
    }
    
    // Extract useful information from the Vision API response
    const response = visionData.responses[0];
    
    // Combine relevant data for ingredient extraction
    const labels = response.labelAnnotations || [];
    const objects = response.localizedObjectAnnotations || [];
    const textAnnotations = response.textAnnotations ? [response.textAnnotations[0]] : [];
    
    // Extract food-related labels and objects
    const foodRelatedItems = [
      ...labels.map(label => label.description),
      ...objects.map(obj => obj.name)
    ];
    
    // Extract any text that might describe ingredients
    const detectedText = textAnnotations.length > 0 ? textAnnotations[0].description : '';
    
    console.log('Food related items detected:', foodRelatedItems);
    console.log('Text detected in image:', detectedText);
    
    // Skip OpenAI processing if we don't have any useful data
    if (foodRelatedItems.length === 0 && !detectedText && !userDescription) {
      throw new Error('No food items or text detected in the image');
    }
    
    // Step 2: Process the Google Vision results with a specialized prompt to extract ingredients
    // We'll use a specialized algorithm to convert Google's labels to ingredients
    const ingredients = extractIngredientsFromGoogleVisionResults(
      foodRelatedItems, 
      detectedText, 
      userDescription
    );
    
    return ingredients;
  } catch (error) {
    console.error('Error in extractIngredientsWithGoogleVision:', error);
    throw error;
  }
}

function extractIngredientsFromGoogleVisionResults(foodItems, detectedText, userDescription) {
  console.log('Processing Google Vision results to extract ingredients');
  
  // Filter out non-food items using a basic food-related keyword list
  const foodKeywords = [
    'food', 'dish', 'meal', 'ingredient', 'vegetable', 'fruit', 'meat', 
    'seafood', 'dairy', 'spice', 'herb', 'grain', 'rice', 'pasta', 'sauce',
    'oil', 'cheese', 'chicken', 'beef', 'pork', 'fish', 'potato', 'tomato',
    'onion', 'garlic', 'pepper', 'salt', 'salad', 'soup', 'stew', 'curry',
    'bread', 'pastry', 'dessert', 'cake', 'cookie', 'pie', 'chocolate',
    'egg', 'milk', 'cream', 'yogurt', 'butter', 'sugar', 'flour', 'bean',
    'lentil', 'nut', 'seed', 'plant-based'
  ];
  
  // Remove generic non-ingredient items
  const nonIngredientTerms = [
    'food', 'dish', 'meal', 'cuisine', 'recipe', 'ingredient', 'snack', 
    'breakfast', 'lunch', 'dinner', 'plate', 'bowl', 'tableware', 'utensil',
    'restaurant', 'kitchen', 'cooking', 'baking', 'table', 'dining', 'meal'
  ];
  
  // Filter to likely food items
  const likelyIngredients = foodItems.filter(item => {
    // Convert to lowercase for comparison
    const lowerItem = item.toLowerCase();
    
    // Check if it's a likely food item
    const isFoodRelated = foodKeywords.some(keyword => 
      lowerItem.includes(keyword) || 
      lowerItem === keyword
    );
    
    // Exclude generic terms
    const isGenericTerm = nonIngredientTerms.some(term => 
      lowerItem === term || 
      lowerItem === term + 's'
    );
    
    return isFoodRelated && !isGenericTerm;
  });
  
  // Create ingredients list
  const ingredients = [];
  
  // Add user description as context if available
  if (userDescription && userDescription.trim() !== '') {
    // Use the user description to see if we can extract a main ingredient
    const userDescriptionLower = userDescription.toLowerCase();
    const mainIngredient = {
      name: userDescription,
      quantity: "amount visible in image"
    };
    
    // Only add if it's not already in the list
    if (!ingredients.some(item => item.name.toLowerCase() === userDescriptionLower)) {
      ingredients.push(mainIngredient);
    }
  }
  
  // Add detected food items from Vision API
  for (const item of likelyIngredients) {
    // Skip if already added (case insensitive)
    if (ingredients.some(existing => 
      existing.name.toLowerCase() === item.toLowerCase()
    )) {
      continue;
    }
    
    ingredients.push({
      name: item,
      quantity: "visible in image" 
    });
  }
  
  // Process detected text if available
  if (detectedText && detectedText.length > 0) {
    // Check if text contains ingredient-like patterns (quantities + items)
    const lines = detectedText.split('\n');
    for (const line of lines) {
      // Look for patterns like "1 cup flour" or "2 tablespoons sugar"
      const quantityMatch = line.match(/(\d+\s*(?:cup|tbsp|tablespoon|tsp|teaspoon|oz|ounce|lb|pound|g|gram|ml|liter|bunch|slice|piece|clove)s?\s+[\w\s]+)/i);
      
      if (quantityMatch) {
        const [, potentialIngredient] = quantityMatch;
        
        // Extract name and quantity
        const parts = potentialIngredient.split(/\s+/);
        const quantity = parts.slice(0, 2).join(' ');
        const name = parts.slice(2).join(' ');
        
        // Only add if not a duplicate
        if (name && name.length > 1 && !ingredients.some(existing => 
          existing.name.toLowerCase() === name.toLowerCase()
        )) {
          ingredients.push({ name, quantity });
        }
      }
    }
  }
  
  // Ensure we have at least one ingredient
  if (ingredients.length === 0) {
    throw new Error('Could not identify any food ingredients in the image');
  }
  
  return ingredients;
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
