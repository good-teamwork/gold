import { useState } from "react";
import { Search, Grid, List, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { enqueueChange } from "@/lib/sync";

interface JewelryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const JewelryCollection = () => {
  const { toast } = useToast();
  const { data: searchQuery, updateData: setSearchQuery } = useOfflineStorage<string>("jewelry_search", "");
  const { data: viewMode, updateData: setViewMode } = useOfflineStorage<'grid' | 'list'>("jewelry_viewMode", 'grid');
  const { data: jewelryItems, updateData: setJewelryItems } = useOfflineStorage<JewelryItem[]>("jewelry_items", [
    {
      id: "1",
      name: "Diamond Earrings",
      description: "Beautiful diamond stud earrings",
      price: 250000,
      image: "https://images.unsplash.com/photo-1724937798223-720f8956cb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxkaWFtb25kLWVhcnJpbmdzfGVufDF8MHx8fDE3NTM3NjY5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: "2",
      name: "Gold Wedding Ring",
      description: "Traditional gold wedding band",
      price: 85000,
      image: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5fGVufDF8MHx8fDE3NTM3NTkzMjh8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: "3",
      name: "Pearl Necklace",
      description: "Elegant cultured pearl necklace",
      price: 125000,
      image: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5fGVufDF8MHx8fDE3NTM3NTkzMjh8MA&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: ""
  });

  const filteredItems = jewelryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newItem: JewelryItem = {
      id: Date.now().toString(),
      ...formData,
      price: parseFloat(formData.price) || 0,
      image: formData.image || "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5fGVufDF8MHx8fDE3NTM3NTkzMjh8MA&ixlib=rb-4.1.0&q=80&w=1080"
    };

    setJewelryItems(prev => [...prev, newItem]);
    enqueueChange('inventory_items', 'upsert', {
      id: newItem.id,
      item_type: 'jewelry',
      name: newItem.name,
      attributes: { description: newItem.description },
      price: newItem.price,
      image: newItem.image,
      updated_at: new Date().toISOString(),
    });
    setFormData({ name: "", description: "", price: "", image: "" });
    setShowAddDialog(false);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to the collection.`
    });
  };

  const handleEditItem = (item: JewelryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      image: item.image
    });
    setShowEditDialog(true);
  };

  const handleUpdateItem = () => {
    if (!selectedItem || !formData.name || !formData.description || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const updatedItem: JewelryItem = {
      ...selectedItem,
      ...formData,
      price: parseFloat(formData.price) || 0
    };

    setJewelryItems(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    enqueueChange('inventory_items', 'upsert', {
      id: updatedItem.id,
      item_type: 'jewelry',
      name: updatedItem.name,
      attributes: { description: updatedItem.description },
      price: updatedItem.price,
      image: updatedItem.image,
      updated_at: new Date().toISOString(),
    });
    setFormData({ name: "", description: "", price: "", image: "" });
    setSelectedItem(null);
    setShowEditDialog(false);
    toast({
      title: "Item Updated",
      description: `${updatedItem.name} has been updated.`
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = jewelryItems.find(i => i.id === id);
    setJewelryItems(prev => prev.filter(item => item.id !== id));
    enqueueChange('inventory_items', 'delete', { id });
    toast({
      title: "Item Removed",
      description: item ? `${item.name} has been removed from the collection.` : "Item has been removed.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">Jewelry Collection</h1>
                <p className="text-green-500">Our Jewelry</p>
              </div>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <Link to="/" className="ml-4">
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Search and View Controls */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Jewelry Items */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div 
                className="h-48 bg-cover bg-center bg-black"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="p-6">
                <h3 className="text-lg font-bold text-green-600 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-600">₹{item.price.toLocaleString()}</span>
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => handleEditItem(item)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 px-2"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteItem(item.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-3">
                      Order Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </main>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Jewelry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Diamond Earrings"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Beautiful diamond stud earrings"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 250000"
              />
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700">
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Jewelry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Diamond Earrings"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Beautiful diamond stud earrings"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 250000"
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem} className="bg-green-600 hover:bg-green-700">
                Update Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JewelryCollection;