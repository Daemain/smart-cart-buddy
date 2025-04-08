import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChefHat, Upload, X, Camera, Image, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';

interface RecipeExtractorProps {
  onExtractComplete: (ingredients: {
    name: string;
    quantity: string;
  }[], recipeName: string) => void;
  isPremium: boolean;
}

const recipeNameSchema = z.object({
  recipeName: z.string().min(1, 'Recipe name is required')
});

type RecipeNameFormValues = z.infer<typeof recipeNameSchema>;

const RecipeExtractor: React.FC<RecipeExtractorProps> = ({
  onExtractComplete,
  isPremium
}) => {
  const [recipeText, setRecipeText] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [open, setOpen] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [activeTab, setActiveTab] = useState('text');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<{
    name: string;
    quantity: string;
  }[]>([]);
  const [showNameForm, setShowNameForm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const form = useForm<RecipeNameFormValues>({
    resolver: zodResolver(recipeNameSchema),
    defaultValues: {
      recipeName: ''
    }
  });

  useEffect(() => {
    const storedCount = localStorage.getItem('recipeExtractorUsageCount');
    if (storedCount) {
      setUsageCount(parseInt(storedCount, 10));
    }
  }, []);

  const processImageForRecipe = async (fileDataUrl: string) => {
    try {
      const base64Data = fileDataUrl.split(',')[1];
      setImageBase64(base64Data);
      
      toast({
        title: "Image uploaded",
        description: "Please add a description of what's in the image to help with ingredient extraction."
      });
      
      return true;
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image processing failed",
        description: "We couldn't process this image. Please try again or enter the recipe manually.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setImagePreview(dataUrl);
        processImageForRecipe(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCapture = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera access failed",
        description: "We couldn't access your camera. Please check your permissions or try uploading an image instead.",
        variant: "destructive"
      });
      setIsCapturing(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(imageDataUrl);
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        setIsCapturing(false);
        processImageForRecipe(imageDataUrl);
      }
    }
  };

  const cancelCapture = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    setIsCapturing(false);
  };

  const extractIngredientsWithAI = async (text: string, imgBase64?: string, description?: string) => {
    try {
      const payload: any = {};
      
      if (text) {
        payload.recipeText = text;
      }
      
      if (imgBase64 && description) {
        payload.imageBase64 = imgBase64;
        payload.userDescription = description;
      }
      
      const {
        data,
        error
      } = await supabase.functions.invoke('extract-ingredients', {
        body: payload
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.ingredients || !Array.isArray(data.ingredients)) {
        throw new Error('Invalid response from AI service');
      }
      
      return data.ingredients;
    } catch (error) {
      console.error('Error extracting ingredients with AI:', error);
      throw error;
    }
  };

  const handleExtract = async () => {
    const freeUsesRemaining = 2 - usageCount;
    
    if (!isPremium && usageCount >= 2) {
      toast({
        title: "Free Tries Used",
        description: `You've used your ${usageCount} free recipe extractions. Upgrade to premium for unlimited use.`,
        variant: "destructive"
      });
      setOpen(false);
      return;
    }
    
    const hasText = !!recipeText.trim();
    const hasImage = !!imageBase64;
    const hasDescription = !!userDescription.trim();
    
    if (!hasText && (!hasImage || !hasDescription)) {
      toast({
        title: "Missing Information",
        description: "Please either enter a dish/recipe text, or upload an image with a description.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExtracting(true);
    
    try {
      let ingredients;
      
      try {
        if (hasText) {
          ingredients = await extractIngredientsWithAI(recipeText);
        } else if (hasImage && hasDescription) {
          ingredients = await extractIngredientsWithAI('', imageBase64!, userDescription);
        }
        
        console.log("Extracted ingredients:", ingredients);
      } catch (aiError) {
        console.error('AI extraction failed, falling back to basic parsing:', aiError);
        toast({
          title: "AI extraction unavailable",
          description: "Using basic extraction instead. Results may be limited."
        });

        // Use our fallback parser
        ingredients = hasText ? parseRecipe(recipeText) : parseRecipe(userDescription);
      }
      
      if (!ingredients || ingredients.length === 0) {
        toast({
          title: "No ingredients found",
          description: "We couldn't extract any ingredients. Please try being more specific or use a different recipe.",
          variant: "destructive"
        });
      } else {
        if (!isPremium) {
          const newCount = usageCount + 1;
          setUsageCount(newCount);
          localStorage.setItem('recipeExtractorUsageCount', newCount.toString());
          
          if (freeUsesRemaining === 1) {
            toast({
              title: "Ingredients extracted",
              description: `Found ${ingredients.length} ingredients. This was your last free extraction.`
            });
          } else {
            toast({
              title: "Ingredients extracted",
              description: `Found ${ingredients.length} ingredients. You have ${freeUsesRemaining - 1} free extractions left.`
            });
          }
        } else {
          toast({
            title: "Ingredients extracted",
            description: `Found ${ingredients.length} ingredients for your dish.`
          });
        }
        
        setExtractedIngredients(ingredients);

        let defaultName = '';
        if (hasText) {
          defaultName = recipeText.trim();
        } else if (hasDescription) {
          defaultName = userDescription.trim();
        }
        
        if (defaultName.split(' ').length <= 3) {
          form.setValue('recipeName', defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
        } else {
          form.setValue('recipeName', 'My Recipe');
        }
        
        setShowNameForm(true);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction failed",
        description: "There was an error extracting the ingredients. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const parseRecipe = (text: string): {
    name: string;
    quantity: string;
  }[] => {
    const lines = text.split('\n');
    const ingredients: {
      name: string;
      quantity: string;
    }[] = [];

    if (lines.length === 1 && text.trim().length > 0) {
      return [{
        name: text.trim(),
        quantity: '1 serving'
      }];
    }
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      const quantityMatch = line.match(/^([\d\/\.\s]+)?\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|pound|lb|g|kg|ml|l)s?\s+of\s+(.+)$/) || line.match(/^([\d\/\.\s]+)?\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|pound|lb|g|kg|ml|l)s?\s+(.+)$/) || line.match(/^([\d\/\.\s]+)?\s+(.+)$/);
      if (quantityMatch) {
        const quantity = quantityMatch[1] ? quantityMatch[1].trim() : '';
        const unit = quantityMatch[2] ? quantityMatch[2].trim() : '';
        const name = quantityMatch[3] ? quantityMatch[3].trim() : quantityMatch[2];
        const quantityText = [quantity, unit].filter(Boolean).join(' ');
        ingredients.push({
          name: name,
          quantity: quantityText || '1'
        });
      } else if (line.length > 2 && !line.startsWith('Step')) {
        ingredients.push({
          name: line,
          quantity: ''
        });
      }
    });
    return ingredients;
  };

  const onSubmitRecipeName = (values: RecipeNameFormValues) => {
    onExtractComplete(extractedIngredients, values.recipeName);
    setOpen(false);
    setRecipeText('');
    setImagePreview(null);
    setImageBase64(null);
    setUserDescription('');
    setShowNameForm(false);
    setExtractedIngredients([]);
    form.reset();
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setUserDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="flex items-center gap-2 h-10 min-w-[40px] sm:min-w-fit">
          <ChefHat className="h-5 w-5" />
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Use AI</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {showNameForm ? (
          <>
            <DialogHeader>
              <DialogTitle>Name Your Recipe</DialogTitle>
              <DialogDescription>
                Give your recipe a name to save it to your collection
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitRecipeName)} className="space-y-4">
                <FormField 
                  control={form.control} 
                  name="recipeName" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Delicious Recipe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
                
                <div className="text-sm text-muted-foreground">
                  {extractedIngredients.length} ingredients extracted
                </div>
                
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNameForm(false)} className="my-0">
                    Back
                  </Button>
                  <Button type="submit">
                    Save Recipe
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader className="my-[8px]">
              <DialogTitle className="text-base">Extract Ingredients for Any Dish</DialogTitle>
              <DialogDescription className="font-light text-sm">
                {!isPremium && usageCount >= 2 ? "You've used your free recipe extractions. Upgrade to premium for unlimited use." : "Enter a dish name, paste a recipe, or upload an image to get ingredients"}
              </DialogDescription>
            </DialogHeader>
            
            {!isPremium && usageCount >= 2 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground">
                  Upgrade to premium to automatically extract ingredients from recipes
                </p>
                <Button className="mt-4" onClick={() => {
                  setOpen(false);
                  toast({
                    title: "Premium Feature",
                    description: "Recipe extraction is a premium feature. Please upgrade to use it."
                  });
                }}>
                  Upgrade to Premium
                </Button>
              </div>
            ) : (
              <>
                {isCapturing ? (
                  <div className="grid gap-4">
                    <div className="relative">
                      <video ref={videoRef} className="w-full h-64 object-cover rounded-md bg-muted" autoPlay playsInline></video>
                      <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                    <div className="flex justify-between gap-2">
                      <Button variant="outline" onClick={cancelCapture}>
                        Cancel
                      </Button>
                      <Button onClick={captureImage}>
                        Take Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="image">Upload</TabsTrigger>
                      <TabsTrigger value="camera">Camera</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-0">
                      <div className="grid gap-2">
                        <label htmlFor="recipe-text" className="text-sm font-medium">
                          Enter a dish or paste a recipe
                        </label>
                        <Textarea 
                          id="recipe-text" 
                          placeholder="Type a dish name (e.g., 'Egusi' or 'Lasagna') or paste a full recipe..." 
                          rows={6} 
                          value={recipeText} 
                          onChange={e => setRecipeText(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground">
                          You can type a food name like "Egusi" or "Jollof Rice" to get ingredients
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image" className="mt-0">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <img src={imagePreview} alt="Recipe" className="w-full max-h-48 object-contain rounded-md border" />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80" 
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid gap-2">
                            <label htmlFor="image-description" className="text-sm font-medium">
                              Describe what's in the image
                            </label>
                            <Textarea 
                              id="image-description" 
                              placeholder="E.g., 'Homemade chocolate chip cookies' or 'A page from my grandmother's lasagna recipe'" 
                              rows={3} 
                              value={userDescription} 
                              onChange={e => setUserDescription(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">
                              Adding details helps extract ingredients more accurately
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Image className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Click to upload a recipe image
                            </p>
                            <p className="text-xs text-muted-foreground">
                              or drag and drop here
                            </p>
                          </div>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                      />
                      {!imagePreview && (
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full my-[16px]">
                          <Upload className="mr-2 h-4 w-4" />
                          Choose File
                        </Button>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="camera" className="mt-0">
                      <div className="grid gap-4">
                        <div 
                          className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" 
                          onClick={startCapture}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Take a photo of your recipe
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Use your device camera to capture a recipe
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={startCapture}>
                          <Camera className="mr-2 h-4 w-4" />
                          Open Camera
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setOpen(false)} className="my-[16px]">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExtract} 
                    disabled={isExtracting || (!recipeText && (!imagePreview || !userDescription))}
                  >
                    {isExtracting ? "Extracting..." : "Extract Ingredients"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeExtractor;
