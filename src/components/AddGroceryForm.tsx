
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Plus, ListPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface AddGroceryFormProps {
  addGroceryItem: (name: string, quantity: string, notes?: string) => void;
}

const AddGroceryForm: React.FC<AddGroceryFormProps> = ({ addGroceryItem }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !quantity) return;
    
    addGroceryItem(name, quantity, notes);
    
    // Reset form
    setName('');
    setQuantity('');
    setNotes('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 rounded-full">
          <Plus className="h-4 w-4" />
          <span className="sm:inline hidden">Add Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Grocery Item</DialogTitle>
          <DialogDescription>Add a new item to your grocery list</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Item Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Milk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity
            </Label>
            <Input
              id="quantity"
              placeholder="e.g., 1 gallon"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="gap-1">
              <ListPlus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroceryForm;
