import { MoreVertical, Edit, Trash2, Eye, Gem, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface JewelryItem {
  id: string;
  name: string;
  type: string;
  gemstone: string;
  carat: number;
  metal: string;
  price: number;
  inStock: number;
  isArtificial?: boolean;
  image?: string;
}

interface JewelryCardProps {
  item: JewelryItem;
  onEdit: (item: JewelryItem) => void;
  onDelete: (id: string) => void;
  onView: (item: JewelryItem) => void;
  onAddToCart?: (item: JewelryItem) => void;
  showAddToCart?: boolean;
  showActions?: boolean;
}

export const JewelryCard = ({ item, onEdit, onDelete, onView, onAddToCart, showAddToCart = false, showActions = true }: JewelryCardProps) => {
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock < 3) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus(item.inStock);

  return (
    <Card 
      className="bg-card shadow-card border-border/50 hover:shadow-elegant transition-smooth overflow-hidden group cursor-pointer"
      onClick={() => onView(item)}
    >
      <CardContent className="p-0">
        {/* Image or placeholder */}
        <div className="h-48 bg-gradient-gold relative overflow-hidden">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <Gem className="h-16 w-16 text-primary/50" />
            </div>
          )}
          {item.isArtificial && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              Artificial
            </Badge>
          )}
          <Badge 
            variant={stockStatus.variant}
            className="absolute top-3 right-3"
          >
            {stockStatus.label}
          </Badge>
          
          {/* Actions dropdown (hidden when showActions=false) */}
          {showActions && (
            <div className="absolute top-3 right-3 mr-20 opacity-0 group-hover:opacity-100 transition-smooth">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onView(item)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Item
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground text-lg leading-tight">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.type}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gemstone:</span>
              <span className="font-medium text-foreground">{item.gemstone}</span>
            </div>
            {item.carat > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Carat:</span>
                <span className="font-medium text-foreground">{item.carat}ct</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metal:</span>
              <span className="font-medium text-foreground">{item.metal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stock:</span>
              <span className="font-medium text-foreground">{item.inStock} units</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xl font-semibold text-foreground">₹{item.price.toLocaleString()}</span>
            {showAddToCart && onAddToCart ? (
              <Button
                size="sm"
                disabled={item.inStock === 0}
                onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {item.inStock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onView(item); }}
                className="hover:bg-accent hover:text-accent-foreground transition-smooth"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};