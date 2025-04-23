import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChefHat, Upload, X, Camera, Image, Sparkles, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RecipeExtractorProps {
  onExtractComplete: (ingredients: {
    name: string;
    quantity: string;
  }[], recipeName: string) => void;
  isPremium: boolean;
}

const MAX_FREE_USES = 10;

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
  const [activeTab, setActiveTab] = useState('camera');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<{
    name: string;
    quantity: string;
  }[]>([]);
  const [showNameForm, setShowNameForm] = useState(false);
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [analysisMethod, setAnalysisMethod] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (showDescriptionInput && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [showDescriptionInput]);

  useEffect(() => {
    if (!open) {
      resetStates();
    }
  }, [open]);

  const resetStates = () => {
    setRecipeText('');
    setUserDescription('');
    setIsExtracting(false);
    setActiveTab('camera');
    setImagePreview(null);
    setImageBase64(null);
    setIsCapturing(false);
    setExtractedIngredients([]);
    setShowNameForm(false);
    setShowDescriptionInput(false);
    setExtractionError(null);
    setAnalysisMethod(null);
    form.reset();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  const processImageForRecipe = async (fileDataUrl: string) => {
    try {
      const base64Data = fileDataUrl.split(',')[1];
      setImageBase64(base64Data);
      
      setShowDescriptionInput(true);
      setActiveTab('image');
      setExtractionError(null);
      
      return true;
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image processing failed",
        description: "We couldn't process this image. Please try again with a different image.",
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
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
      
      if (imgBase64) {
        payload.imageBase64 = imgBase64;
        payload.userDescription = description || '';
        console.log("Sending image for extraction with description:", description ? description.substring(0, 50) + '...' : 'No description');
      } else if (text) {
        payload.recipeText = text;
        console.log("Sending text for extraction:", text.substring(0, 50) + '...');
      }

      console.log("Payload prepared, invoking edge function...");
      
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('extract-ingredients', {
          body: payload
        });
        
        console.log("Edge function response:", { data, error });
        
        if (error) {
          console.error("Edge function returned an error:", error);
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        if (data.error) {
          console.error("Edge function returned a data error:", data.error);
          if (data.isQuotaError) {
            throw new Error(`OpenAI API quota exceeded. Please try again later or contact support.`);
          }
          throw new Error(data.error);
        }
        
        if (!data.ingredients || !Array.isArray(data.ingredients)) {
          console.error("Invalid ingredients response:", data);
          throw new Error('Invalid response from AI service');
        }
        
        if (data.analysisMethod) {
          setAnalysisMethod(data.analysisMethod);
        }
        
        return data.ingredients;
      } catch (invokeError) {
        console.error("Error invoking edge function:", invokeError);
        if (invokeError.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Could not connect to the AI service. Please check your internet connection and try again.');
        }
        throw invokeError;
      }
    } catch (error) {
      console.error('Error extracting ingredients with AI:', error);
      throw error;
    }
  };

  const handleExtract = async () => {
    const freeUsesRemaining = MAX_FREE_USES - usageCount;
    if (!isPremium && usageCount >= MAX_FREE_USES) {
      toast({
        title: "Free Uses Exhausted",
        description: `You've used your ${MAX_FREE_USES} free recipe extractions. Upgrade to premium for unlimited use.`,
        variant: "destructive"
      });
      setOpen(false);
      return;
    }
    
    const hasImage = !!imageBase64;
    const hasText = !!recipeText.trim();
    const hasDescription = !!userDescription.trim();
    
    if (!hasImage && !hasText) {
      toast({
        title: "Missing Information",
        description: "Please either take a photo/upload an image or enter recipe text.",
        variant: "destructive"
      });
      return;
    }
    
    if (hasImage && !hasDescription) {
      toast({
        title: "Description Recommended",
        description: "Adding a brief description will improve extraction accuracy.",
      });
    }
    
    setIsExtracting(true);
    setExtractionError(null);
    setAnalysisMethod(null);
    
    try {
      let ingredients;
      
      if (hasText) {
        ingredients = await extractIngredientsWithAI(recipeText);
        console.log("Extracted ingredients from text:", ingredients);
      } else if (hasImage) {
        ingredients = await extractIngredientsWithAI('', imageBase64, userDescription);
        console.log("Extracted ingredients from image:", ingredients);
      }
      
      if (!ingredients || ingredients.length === 0) {
        setExtractionError("No ingredients could be identified. Please try a clearer image or more specific description.");
        setIsExtracting(false);
        
        toast.error("No Ingredients Found", {
          description: "We couldn't identify any ingredients. Try providing more details or adding ingredients manually.",
          duration: 6000
        });
        
        return;
      }
      
      if (!isPremium) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('recipeExtractorUsageCount', newCount.toString());
        
        if (freeUsesRemaining === 1) {
          toast.success("Ingredients Extracted", {
            description: `Found ${ingredients.length} ingredients. This was your last free extraction.`
          });
        } else {
          toast.success("Ingredients Extracted", {
            description: `Found ${ingredients.length} ingredients. You have ${freeUsesRemaining - 1} free extractions left.`
          });
        }
      } else {
        toast.success("Ingredients Extracted", {
          description: `Found ${ingredients.length} ingredients for your dish.`
        });
      }
      
      setExtractedIngredients(ingredients);
      
      let defaultName = '';
      if (hasDescription) {
        defaultName = userDescription.trim();
      } else if (hasText) {
        defaultName = recipeText.trim();
      }
      
      if (defaultName.split(' ').length <= 3) {
        form.setValue('recipeName', defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
      } else {
        form.setValue('recipeName', 'My Recipe');
      }
      
      setShowNameForm(true);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionError(error instanceof Error ? error.message : "Unknown error occurred");
      
      toast.error("Extraction Failed", {
        description: "We encountered an unexpected error. Please try again or add ingredients manually.",
        duration: 6000
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const onSubmitRecipeName = (values: RecipeNameFormValues) => {
    onExtractComplete(extractedIngredients, values.recipeName);
    setOpen(false);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setUserDescription('');
    setShowDescriptionInput(false);
    setExtractionError(null);
    setAnalysisMethod(null);
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
                <FormField control={form.control} name="recipeName" render={({
                  field
                }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Delicious Recipe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="text-sm text-muted-foreground">
                  {extractedIngredients.length} ingredients extracted
                  {analysisMethod && (
                    <span className="ml-1">
                      using {analysisMethod.includes('google') ? 'Google Vision AI' : 'OpenAI'}
                    </span>
                  )}
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
              <DialogTitle className="text-base">Extract Ingredients from Food Images</DialogTitle>
              <DialogDescription className="font-light text-sm">
                {!isPremium && usageCount >= MAX_FREE_USES ? 
                  `You've used your ${MAX_FREE_USES} free recipe extractions. Upgrade to premium for unlimited use.` : 
                  "Take a clear photo of your food or enter a recipe to extract ingredients"}
              </DialogDescription>
            </DialogHeader>
            
            {!isPremium && usageCount >= MAX_FREE_USES ? (
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
                ) : showDescriptionInput ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img src={imagePreview} alt="Food" className="w-full max-h-48 object-contain rounded-md border" />
                      <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80" onClick={clearImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="image-description" className="text-sm font-medium">
                        What's in the image? (helpful but optional)
                      </label>
                      <Textarea 
                        id="image-description" 
                        placeholder="E.g., 'White rice' or 'Chicken soup'" 
                        rows={2} 
                        value={userDescription} 
                        onChange={e => setUserDescription(e.target.value)}
                        ref={descriptionInputRef}
                      />
                      <p className="text-xs text-muted-foreground">
                        A simple hint can help identify what's in the image
                      </p>
                    </div>
                    
                    {extractionError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {extractionError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleExtract} disabled={isExtracting}>
                        {isExtracting ? "Analyzing..." : "Analyze Image"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="camera">Camera</TabsTrigger>
                      <TabsTrigger value="image">Upload</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="camera" className="mt-0">
                      <div className="grid gap-4">
                        <div className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={startCapture}>
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Take a photo of your food
                            </p>
                            <p className="text-xs text-muted-foreground">
                              We'll analyze what's visible in the image
                            </p>
                          </div>
                        </div>
                        <Button className="w-full" onClick={startCapture}>
                          <Camera className="mr-2 h-4 w-4" />
                          Open Camera
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image" className="mt-0">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <img src={imagePreview} alt="Food" className="w-full max-h-48 object-contain rounded-md border" />
                            <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80" onClick={clearImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid gap-2">
                            <label htmlFor="image-description" className="text-sm font-medium">
                              What's in the image? (helpful but optional)
                            </label>
                            <Textarea 
                              id="image-description" 
                              placeholder="E.g., 'White rice' or 'Chicken soup'" 
                              rows={2}
                              value={userDescription} 
                              onChange={e => setUserDescription(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              A simple hint can help identify what's in the image
                            </p>
                          </div>
                          
                          {extractionError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>
                                {extractionError}
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <div className="flex justify-end mt-4">
                            <Button onClick={handleExtract} disabled={isExtracting}>
                              {isExtracting ? "Analyzing..." : "Analyze Image"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-md p-8 mt-4 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className="flex flex-col items-center gap-2">
                            <Image className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Click to upload a food image
                            </p>
                            <p className="text-xs text-muted-foreground">
                              or drag and drop here
                            </p>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      {!imagePreview && (
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full my-[16px]">
                          <Upload className="mr-2 h-4 w-4" />
                          Choose File
                        </Button>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="text" className="mt-0">
                      <div className="grid gap-2">
                        <label htmlFor="recipe-text" className="text-sm font-medium">
                          Enter a dish or paste a recipe
                        </label>
                        <Textarea id="recipe-text" placeholder="Type a dish name (e.g., 'Egusi' or 'Lasagna') or paste a full recipe..." rows={6} value={recipeText} onChange={e => setRecipeText(e.target.value)} />
                        <p className="text-xs text-muted-foreground">
                          You can type a food name like "Egusi" or "Jollof Rice" to get ingredients
                        </p>
                      </div>
                      
                      {extractionError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {extractionError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-end mt-4">
                        <Button onClick={handleExtract} disabled={isExtracting || !recipeText.trim()}>
                          {isExtracting ? "Extracting..." : "Extract Ingredients"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeExtractor;
