import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { JewelryItem } from "./JewelryCard";
import { Upload, X } from "lucide-react";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: JewelryItem) => void;
  item: JewelryItem | null;
}

const jewelryTypes = [
  "Ring", "Necklace", "Earrings", "Bracelet", "Brooch", "Pendant", "Chain", "Anklet"
];

const gemstones = [
  "Diamond", "Emerald", "Sapphire", "Ruby", "Pearl", "Amethyst", "Topaz", "Garnet", "Opal", "Turquoise", "Crystal", "None"
];

const metals = [
  "Gold 24K", "Gold 18K", "Gold 14K", "Gold 10K", "White Gold", "Rose Gold", "Platinum", "Silver", "Stainless Steel", "Brass", "Copper"
];

export const EditItemDialog = ({ open, onOpenChange, onSave, item }: EditItemDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    gemstone: "",
    carat: "",
    metal: "",
    price: "",
    inStock: "",
    isArtificial: false,
    image: "",
  });

  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name,
        type: item.type,
        gemstone: item.gemstone,
        carat: item.carat.toString(),
        metal: item.metal,
        price: item.price.toString(),
        inStock: item.inStock.toString(),
        isArtificial: item.isArtificial || false,
        image: item.image || "",
      });
    }
  }, [item, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item || !formData.name || !formData.type || !formData.metal || !formData.price || !formData.inStock) {
      return;
    }

    onSave({
      ...item,
      name: formData.name,
      type: formData.type,
      gemstone: formData.gemstone || "None",
      carat: formData.carat ? parseFloat(formData.carat) : 0,
      metal: formData.metal,
      price: parseFloat(formData.price),
      inStock: parseInt(formData.inStock),
      isArtificial: formData.isArtificial,
      image: formData.image,
    });
    
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Jewelry Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Item Image</Label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="relative">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image ? "Change Image" : "Choose Image"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Diamond Solitaire Ring"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {jewelryTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-gemstone">Gemstone</Label>
              <Select 
                value={formData.gemstone} 
                onValueChange={(value) => setFormData(prev => ({...prev, gemstone: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gemstone" />
                </SelectTrigger>
                <SelectContent>
                  {gemstones.map(stone => (
                    <SelectItem key={stone} value={stone}>{stone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-carat">Carat Weight</Label>
              <Input
                id="edit-carat"
                type="number"
                step="0.1"
                value={formData.carat}
                onChange={(e) => setFormData(prev => ({...prev, carat: e.target.value}))}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-metal">Metal *</Label>
            <Select 
              value={formData.metal} 
              onValueChange={(value) => setFormData(prev => ({...prev, metal: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metal" />
              </SelectTrigger>
              <SelectContent>
                {metals.map(metal => (
                  <SelectItem key={metal} value={metal}>{metal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                placeholder="e.g., 1500.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock Quantity *</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.inStock}
                onChange={(e) => setFormData(prev => ({...prev, inStock: e.target.value}))}
                placeholder="e.g., 5"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-artificial"
              checked={formData.isArtificial}
              onCheckedChange={(checked) => setFormData(prev => ({...prev, isArtificial: checked}))}
            />
            <Label htmlFor="edit-artificial">Artificial Jewelry</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-gold hover:bg-gold-dark text-primary transition-smooth"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};