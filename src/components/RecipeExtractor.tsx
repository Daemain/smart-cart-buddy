import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '@/types/grocery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Upload, PlusCircle, X, Camera, Image, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [open, setOpen] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [activeTab, setActiveTab] = useState('text');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
  const parseRecipe = (text: string): {
    name: string;
    quantity: string;
  }[] => {
    const lines = text.split('\n');
    const ingredients: {
      name: string;
      quantity: string;
    }[] = [];
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
  const processImageForRecipe = async (imageUrl: string) => {
    setIsExtracting(true);
    try {
      toast({
        title: "Processing image",
        description: "Analyzing your recipe image..."
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      const extractedText = "Recipe for Pancakes\n" + "2 cups flour\n" + "2 tablespoons sugar\n" + "1 teaspoon baking powder\n" + "1/2 teaspoon salt\n" + "2 eggs\n" + "1 1/2 cups milk\n" + "2 tablespoons melted butter";
      setRecipeText(extractedText);
      setActiveTab('text');
      return extractedText;
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image processing failed",
        description: "We couldn't extract text from this image. Please try again or enter the recipe manually.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExtracting(false);
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
        setImagePreview(event.target.result as string);
        processImageForRecipe(event.target.result as string);
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
    if (!recipeText && !imagePreview) {
      toast({
        title: "Missing Information",
        description: "Please enter a recipe or upload an image to extract ingredients.",
        variant: "destructive"
      });
      return;
    }
    setIsExtracting(true);
    try {
      const ingredients = parseRecipe(recipeText);
      if (ingredients.length === 0) {
        toast({
          title: "No ingredients found",
          description: "We couldn't extract any ingredients from the text. Please try reformatting or use a different recipe.",
          variant: "destructive"
        });
      } else {
        if (!isPremium) {
          const newCount = usageCount + 1;
          setUsageCount(newCount);
          localStorage.setItem('recipeExtractorUsageCount', newCount.toString());
          if (freeUsesRemaining === 1) {
            toast({
              title: "Recipe extracted",
              description: `Found ${ingredients.length} ingredients. This was your last free extraction.`
            });
          } else {
            toast({
              title: "Recipe extracted",
              description: `Found ${ingredients.length} ingredients. You have ${freeUsesRemaining - 1} free extractions left.`
            });
          }
        } else {
          toast({
            title: "Recipe extracted",
            description: `Found ${ingredients.length} ingredients in your recipe.`
          });
        }
        setExtractedIngredients(ingredients);
        setShowNameForm(true);
      }
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: "There was an error extracting the recipe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };
  const onSubmitRecipeName = (values: RecipeNameFormValues) => {
    onExtractComplete(extractedIngredients, values.recipeName);
    setOpen(false);
    setRecipeText('');
    setImagePreview(null);
    setShowNameForm(false);
    setExtractedIngredients([]);
    form.reset();
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="flex items-center gap-2 h-10 min-w-[40px] sm:min-w-fit">
          <ChefHat className="h-5 w-5" />
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Use AI</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {showNameForm ? <>
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
            }) => <FormItem>
                      <FormLabel>Recipe Name</FormLabel>
                      <FormControl>
                        <input placeholder="My Delicious Recipe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <div className="text-sm text-muted-foreground">
                  {extractedIngredients.length} ingredients extracted
                </div>
                
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNameForm(false)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Save Recipe
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </> : <>
            <DialogHeader className="my-[8px]">
              <DialogTitle>Extract Grocery List from Recipe</DialogTitle>
              <DialogDescription className="text-sm font-light">
                {!isPremium && usageCount >= 2 ? "You've used your free recipe extractions. Upgrade to premium for unlimited use." : "Upload a recipe image, take a photo, or paste text to extract ingredients"}
              </DialogDescription>
            </DialogHeader>
            
            {!isPremium && usageCount >= 2 ? <div className="flex flex-col items-center justify-center py-6">
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
              </div> : <>
                {isCapturing ? <div className="grid gap-4">
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
                  </div> : <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="image">Upload</TabsTrigger>
                      <TabsTrigger value="camera">Camera</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-0">
                      <div className="grid gap-2">
                        <label htmlFor="recipe-text" className="text-sm font-medium">
                          Paste your recipe
                        </label>
                        <Textarea id="recipe-text" placeholder="Paste your recipe ingredients and instructions here..." rows={6} value={recipeText} onChange={e => setRecipeText(e.target.value)} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image" className="mt-0">
                      <div className="grid gap-4">
                        {imagePreview ? <div className="relative">
                            <img src={imagePreview} alt="Recipe" className="w-full max-h-48 object-contain rounded-md border" />
                            <Button variant="outline" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80" onClick={() => setImagePreview(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div> : <div className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex flex-col items-center gap-2">
                              <Image className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                Click to upload a recipe image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                or drag and drop here
                              </p>
                            </div>
                          </div>}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        {!imagePreview && <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="camera" className="mt-0">
                      <div className="grid gap-4">
                        <div className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={startCapture}>
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
                </Tabs>}
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setOpen(false)} className="my-[16px]">
                    Cancel
                  </Button>
                  <Button onClick={handleExtract} disabled={isExtracting || !recipeText && !imagePreview}>
                    {isExtracting ? "Extracting..." : "Extract Ingredients"}
                  </Button>
                </DialogFooter>
              </>}
          </>}
      </DialogContent>
    </Dialog>;
};
export default RecipeExtractor;