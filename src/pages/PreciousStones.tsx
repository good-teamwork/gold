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

interface StoneItem {
  id: string;
  name: string;
  carat: string;
  clarity: string;
  cut: string;
  price: number;
  image: string;
}

const PreciousStones = () => {
  const { toast } = useToast();
  const { data: searchQuery, updateData: setSearchQuery } = useOfflineStorage<string>("stones_search", "");
  const { data: viewMode, updateData: setViewMode } = useOfflineStorage<'grid' | 'list'>("stones_viewMode", 'grid');
  // Use stones_items key - data will be auto-populated by seedWebData
  const { data: stones, updateData: setStones } = useOfflineStorage<StoneItem[]>("stones_items", []);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoneItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    carat: "",
    clarity: "",
    cut: "",
    price: "",
    image: ""
  });

  const filteredItems = stones.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    if (!formData.name || !formData.carat || !formData.clarity || !formData.cut || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newItem: StoneItem = {
      id: Date.now().toString(),
      ...formData,
      price: parseFloat(formData.price) || 0,
      image: formData.image || "https://images.unsplash.com/photo-1631832724508-ea8df04ad455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxwcmVjaW91cy1zdG9uZXN8ZW58MXwwfHx8MTc1Mzc2NjkyMHww&ixlib=rb-4.1.0&q=80&w=1080"
    };

    setStones(prev => [...prev, newItem]);
    enqueueChange('inventory_items', 'upsert', {
      id: newItem.id,
      item_type: 'stone',
      name: newItem.name,
      attributes: { carat: newItem.carat, clarity: newItem.clarity, cut: newItem.cut },
      price: newItem.price,
      image: newItem.image,
      updated_at: new Date().toISOString(),
    });
    setFormData({ name: "", carat: "", clarity: "", cut: "", price: "", image: "" });
    setShowAddDialog(false);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to the collection.`
    });
  };

  const handleEditItem = (item: StoneItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      carat: item.carat,
      clarity: item.clarity,
      cut: item.cut,
      price: item.price.toString(),
      image: item.image
    });
    setShowEditDialog(true);
  };

  const handleUpdateItem = () => {
    if (!selectedItem || !formData.name || !formData.carat || !formData.clarity || !formData.cut || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const updatedItem: StoneItem = {
      ...selectedItem,
      ...formData,
      price: parseFloat(formData.price) || 0
    };

    setStones(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item));
    enqueueChange('inventory_items', 'upsert', {
      id: updatedItem.id,
      item_type: 'stone',
      name: updatedItem.name,
      attributes: { carat: updatedItem.carat, clarity: updatedItem.clarity, cut: updatedItem.cut },
      price: updatedItem.price,
      image: updatedItem.image,
      updated_at: new Date().toISOString(),
    });
    setFormData({ name: "", carat: "", clarity: "", cut: "", price: "", image: "" });
    setSelectedItem(null);
    setShowEditDialog(false);
    toast({
      title: "Item Updated",
      description: `${updatedItem.name} has been updated.`
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = stones.find(i => i.id === id);
    setStones(prev => prev.filter(item => item.id !== id));
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
                <h1 className="text-2xl font-bold text-green-600 mb-2">Precious Stones</h1>
                <p className="text-green-500">Discover our rare and beautiful stones.</p>
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

        {/* Precious Stones */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div 
                className="h-48 bg-cover bg-center bg-gray-800"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="p-6">
                <h3 className="text-lg font-bold text-green-600 mb-2">{item.name}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>Carat: {item.carat}</p>
                  <p>Clarity: {item.clarity}</p>
                  <p>Cut: {item.cut}</p>
                </div>
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
            <DialogTitle>Add New Precious Stone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Natural Diamond"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carat">Carat *</Label>
                <Input
                  id="carat"
                  value={formData.carat}
                  onChange={(e) => setFormData(prev => ({ ...prev, carat: e.target.value }))}
                  placeholder="e.g., 2.5ct"
                />
              </div>
              <div>
                <Label htmlFor="clarity">Clarity *</Label>
                <Input
                  id="clarity"
                  value={formData.clarity}
                  onChange={(e) => setFormData(prev => ({ ...prev, clarity: e.target.value }))}
                  placeholder="e.g., VVS1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cut">Cut *</Label>
              <Input
                id="cut"
                value={formData.cut}
                onChange={(e) => setFormData(prev => ({ ...prev, cut: e.target.value }))}
                placeholder="e.g., Round Brilliant"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 850000"
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
            <DialogTitle>Edit Precious Stone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Natural Diamond"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-carat">Carat *</Label>
                <Input
                  id="edit-carat"
                  value={formData.carat}
                  onChange={(e) => setFormData(prev => ({ ...prev, carat: e.target.value }))}
                  placeholder="e.g., 2.5ct"
                />
              </div>
              <div>
                <Label htmlFor="edit-clarity">Clarity *</Label>
                <Input
                  id="edit-clarity"
                  value={formData.clarity}
                  onChange={(e) => setFormData(prev => ({ ...prev, clarity: e.target.value }))}
                  placeholder="e.g., VVS1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-cut">Cut *</Label>
              <Input
                id="edit-cut"
                value={formData.cut}
                onChange={(e) => setFormData(prev => ({ ...prev, cut: e.target.value }))}
                placeholder="e.g., Round Brilliant"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 850000"
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

export default PreciousStones;