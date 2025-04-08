
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
    console.log('Starting extract-ingredients function');
    
    // Log API key availability for debugging
    const hasOpenAIKey = !!openAIApiKey;
    const hasGoogleKey = !!googleCloudApiKey;
    
    console.log('API Keys check:', { 
      openAIKeyAvailable: hasOpenAIKey,
      googleCloudKeyAvailable: hasGoogleKey,
      googleKeyLength: hasGoogleKey ? googleCloudApiKey.length : 0
    });
    
    if (!hasOpenAIKey && !hasGoogleKey) {
      console.error('No API keys configured. Both OpenAI and Google Cloud Vision API keys are missing.');
      return new Response(JSON.stringify({ 
        error: 'No image analysis API keys configured. Please configure either OpenAI or Google Cloud Vision API.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully');
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { recipeText, imageBase64, userDescription } = body;
    
    console.log('Input validation:', {
      hasRecipeText: !!recipeText,
      hasImageBase64: !!imageBase64,
      hasUserDescription: !!userDescription,
      imageBase64Length: imageBase64 ? imageBase64.length : 0
    });
    
    // Check if we have either image with description or text input
    if (!imageBase64 && (!recipeText || recipeText.trim() === '')) {
      return new Response(JSON.stringify({ error: 'Either an image or recipe text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let ingredients;
    let analysisMethod = '';
    let apiErrorMessages = [];
    
    // Prioritize image-based extraction if available
    if (imageBase64) {
      console.log('Processing image with description:', userDescription ? userDescription.substring(0, 100) + '...' : 'No description provided');
      
      // Try Google Cloud Vision first if the key is available
      if (hasGoogleKey) {
        try {
          console.log('Attempting extraction with Google Cloud Vision API');
          ingredients = await extractIngredientsWithGoogleVision(imageBase64, userDescription || '');
          console.log('Successfully extracted ingredients with Google Vision:', JSON.stringify(ingredients));
          analysisMethod = 'google';
        } catch (googleError) {
          console.error('Google Vision extraction failed:', googleError);
          apiErrorMessages.push(`Google Vision: ${googleError.message}`);
          
          // If Google Vision fails and OpenAI is available, try that next
          if (hasOpenAIKey) {
            try {
              console.log('Falling back to OpenAI for image analysis...');
              ingredients = await extractIngredientsFromImageWithOpenAI(imageBase64, userDescription || '');
              console.log('Successfully extracted ingredients with OpenAI:', JSON.stringify(ingredients));
              analysisMethod = 'openai';
            } catch (aiError) {
              console.error('OpenAI image extraction failed:', aiError);
              apiErrorMessages.push(`OpenAI: ${aiError.message}`);
            }
          }
        }
      } 
      // If no Google key but OpenAI is available
      else if (hasOpenAIKey) {
        try {
          console.log('Using OpenAI Vision API for image analysis...');
          ingredients = await extractIngredientsFromImageWithOpenAI(imageBase64, userDescription || '');
          console.log('Successfully extracted ingredients from image with OpenAI:', JSON.stringify(ingredients));
          analysisMethod = 'openai';
        } catch (aiError) {
          console.error('OpenAI image extraction failed:', aiError);
          apiErrorMessages.push(`OpenAI: ${aiError.message}`);
        }
      }
    }
    
    // Use text-based extraction if no image or as fallback
    if (!ingredients && recipeText) {
      console.log('Processing recipe text:', recipeText.substring(0, 100) + '...');
      
      if (hasOpenAIKey) {
        try {
          ingredients = await extractIngredientsWithOpenAI(recipeText);
          console.log('Successfully extracted ingredients with OpenAI:', JSON.stringify(ingredients));
          analysisMethod = 'openai-text';
        } catch (aiError) {
          console.error('OpenAI text extraction failed:', aiError);
          apiErrorMessages.push(`OpenAI Text: ${aiError.message}`);
        }
      }
    }
    
    // If all methods failed, return a consolidated error
    if (!ingredients || ingredients.length === 0) {
      const errorMessage = apiErrorMessages.length > 0 
        ? `AI services failed: ${apiErrorMessages.join('; ')}` 
        : 'No ingredients could be identified. Try a clearer image or more detailed description.';
      
      const isQuotaError = apiErrorMessages.some(msg => msg.includes('quota') || msg.includes('rate_limit'));
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        isQuotaError: isQuotaError
      }), {
        status: isQuotaError ? 429 : 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ ingredients, analysisMethod }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unhandled error in extract-ingredients function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      details: error.stack || "No stack trace available"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractIngredientsFromImageWithOpenAI(imageBase64, userDescription) {
  console.log('Sending image to OpenAI vision API with description:', userDescription.substring(0, 50));
  
  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
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
6. Provide realistic quantities based on what you see - estimate appropriate measurements for cooking
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
                   `Analyze this food image and list ONLY the ingredients you can physically see in the image with appropriate quantity estimates.
                    For context only (DO NOT use this to guess invisible ingredients): The food might be ${userDescription}.
                    Again, ONLY list ingredients you can actually SEE in the image with estimated quantities, not a generic recipe.` 
                  : "Analyze this food image and list ONLY the ingredients you can physically see in the image with appropriate quantity estimates. DO NOT provide a generic recipe."
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
      
      if (errorData.error?.code === 'rate_limit_exceeded' || 
          errorData.error?.type === 'insufficient_quota' ||
          (errorData.error?.message && errorData.error.message.includes('quota'))) {
        throw new Error(`OpenAI API quota exceeded: ${errorData.error?.message || 'Rate limit reached'}`);
      }
      
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText || 'Unknown API error'}`);
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
    if (!googleCloudApiKey) {
      throw new Error('Google Cloud API key is not configured');
    }
    
    // Step 1: Analyze the image with Google Cloud Vision API
    console.log('Sending request to Google Cloud Vision API...');
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`;
    console.log('Using Vision API endpoint:', visionApiUrl.split('?')[0]);
    
    const visionResponse = await fetch(visionApiUrl, {
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

    // Log the status and headers for debugging
    console.log('Google Vision API response status:', visionResponse.status);
    
    const responseText = await visionResponse.text();
    let visionData;
    
    try {
      visionData = JSON.parse(responseText);
      console.log('Google Vision API parsed response:', 
        visionData.error ? 
        JSON.stringify(visionData.error) : 
        'Success (response too large to log fully)');
    } catch (parseError) {
      console.error('Failed to parse Google Vision API response:', parseError);
      console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));
      throw new Error(`Failed to parse Google Vision API response: ${parseError.message}`);
    }
    
    if (visionData.error) {
      console.error('Google Vision API returned an error:', visionData.error);
      throw new Error(`Google Vision API error: ${visionData.error.message || JSON.stringify(visionData.error)}`);
    }
    
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
    
    // Skip processing if we don't have any useful data
    if (foodRelatedItems.length === 0 && !detectedText && !userDescription) {
      throw new Error('No food items or text detected in the image');
    }
    
    // Process the Google Vision results to extract ingredients
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
      quantity: estimateQuantity(userDescription)
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
      quantity: estimateQuantity(item)
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

// Function to estimate realistic quantities based on the ingredient type
function estimateQuantity(ingredientName) {
  // Convert to lowercase for matching
  const name = ingredientName.toLowerCase();
  
  // Common protein sources (meats, fish, etc.)
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('lamb') || name.includes('turkey') ||
      name.includes('shrimp') || name.includes('tofu')) {
    return name.includes('ground') ? "1 pound" : "2-3 pieces";
  }
  
  // Rice and grains
  if (name.includes('rice') || name.includes('quinoa') || name.includes('couscous')) {
    return "1 cup";
  }
  
  // Pasta
  if (name.includes('pasta') || name.includes('noodle') || name.includes('spaghetti')) {
    return "8 oz";
  }
  
  // Vegetables
  if (name.includes('onion')) return "1 medium";
  if (name.includes('garlic')) return "2-3 cloves";
  if (name.includes('tomato')) return name.includes('cherry') ? "1 cup" : "2 medium";
  if (name.includes('potato')) return "2 medium";
  if (name.includes('carrot')) return "2 medium";
  if (name.includes('pepper')) {
    if (name.includes('bell')) return "1 medium";
    return "1 teaspoon"; // Assuming ground pepper
  }
  if (name.includes('lettuce') || name.includes('spinach') || name.includes('kale')) {
    return "2 cups";
  }
  if (name.includes('cucumber')) return "1 medium";
  if (name.includes('zucchini')) return "1 medium";
  if (name.includes('broccoli') || name.includes('cauliflower')) return "1 cup florets";
  
  // Fruits
  if (name.includes('apple') || name.includes('orange') || name.includes('peach')) {
    return "1 medium";
  }
  if (name.includes('banana')) return "1 medium";
  if (name.includes('berry') || name.includes('strawberry') || name.includes('blueberry')) {
    return "1 cup";
  }
  
  // Dairy
  if (name.includes('milk')) return "1 cup";
  if (name.includes('yogurt')) return "1 cup";
  if (name.includes('cream')) {
    if (name.includes('heavy') || name.includes('whipping')) return "1/2 cup";
    if (name.includes('sour')) return "1/4 cup";
    return "2 tablespoons";
  }
  if (name.includes('cheese')) {
    if (name.includes('grated') || name.includes('shredded')) return "1/2 cup";
    return "4 oz";
  }
  if (name.includes('butter')) return "2 tablespoons";
  if (name.includes('egg')) return name.includes('eggs') ? "3-4 eggs" : "1 egg";
  
  // Oils, vinegars, and condiments
  if (name.includes('oil')) return "2 tablespoons";
  if (name.includes('vinegar')) return "1 tablespoon";
  if (name.includes('sauce')) {
    if (name.includes('hot') || name.includes('soy')) return "1 tablespoon";
    if (name.includes('tomato')) return "1 cup";
    return "1/4 cup";
  }
  if (name.includes('mayo') || name.includes('mustard') || name.includes('ketchup')) {
    return "2 tablespoons";
  }
  
  // Herbs and spices
  if (name.includes('salt') || name.includes('pepper') || 
      name.includes('cumin') || name.includes('paprika') ||
      name.includes('oregano') || name.includes('basil') ||
      name.includes('thyme') || name.includes('spice')) {
    return "1 teaspoon";
  }
  if (name.includes('herb') || name.includes('parsley') || name.includes('cilantro') || name.includes('mint')) {
    return "2 tablespoons, chopped";
  }
  
  // Beans and legumes
  if (name.includes('bean') || name.includes('lentil') || name.includes('chickpea')) {
    return "1 cup";
  }
  
  // Nuts and seeds
  if (name.includes('nut') || name.includes('seed') || 
      name.includes('almond') || name.includes('walnut') ||
      name.includes('cashew') || name.includes('sunflower') ||
      name.includes('sesame')) {
    return "1/4 cup";
  }
  
  // Flours and dry ingredients
  if (name.includes('flour') || name.includes('sugar') || name.includes('oat')) {
    return "1 cup";
  }
  
  // Liquids
  if (name.includes('water') || name.includes('broth') || name.includes('stock')) {
    return "2 cups";
  }
  
  // Default fallback for unknown ingredients
  return "to taste";
}

async function extractIngredientsWithOpenAI(recipeText) {
  console.log('Sending text to OpenAI for ingredient extraction');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
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
      
      if (errorData.error?.code === 'rate_limit_exceeded' || 
          errorData.error?.type === 'insufficient_quota' ||
          (errorData.error?.message && errorData.error.message.includes('quota'))) {
        throw new Error(`OpenAI API quota exceeded: ${errorData.error?.message || 'Rate limit reached'}`);
      }
      
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText || 'Unknown API error'}`);
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
  } catch (error) {
    console.error('Error in extractIngredientsWithOpenAI:', error);
    throw error;
  }
}
