import { useState } from "react";
import { Gem, Package, TrendingUp, DollarSign, Search, Plus } from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { StatsCard } from "@/components/StatsCard";
import { JewelryCard, JewelryItem } from "@/components/JewelryCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { ViewItemDialog } from "@/components/ViewItemDialog";
import { CraftsmenManagement, Craftsman } from "@/components/CraftsmenManagement";
import { TransactionDialog } from "@/components/TransactionDialog";
import { BusinessSettings } from "@/components/BusinessSettings";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { AIAnalyticsDashboard } from "@/components/AIAnalyticsDashboard";
import { ReportingDashboard } from "@/components/ReportingDashboard";
import { CustomerLedger } from "@/components/CustomerLedger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import heroImage from "@/assets/hero-jewelry.jpg";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  metal: string;
  gemstone: string;
}

interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
  customerName?: string;
  customerPhone?: string;
}

const Index = () => {
  console.log("Index component rendering...");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  console.log("Active tab:", activeTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<JewelryItem | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Use standardized key that matches seed data - data will be auto-populated by seedWebData
  const { data: items, updateData: setItems } = useOfflineStorage<JewelryItem[]>('jewelry_items', []);

  // Use standardized key for craftsmen - data will be auto-populated by seedWebData
  const { data: craftsmen, updateData: setCraftsmen } = useOfflineStorage<Craftsman[]>('craftsmen', []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.gemstone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.inStock), 0);
  const totalItems = items.reduce((sum, item) => sum + item.inStock, 0);
  const lowStockItems = items.filter(item => item.inStock < 5).length;
  const todayRevenue = transactions
    .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.total, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddItem = (newItem: Omit<JewelryItem, 'id'>) => {
    const item: JewelryItem = {
      ...newItem,
      id: Date.now().toString()
    };
    setItems(prev => [...prev, item]);
    toast({
      title: "Item Added",
      description: `${item.name} has been added to your inventory.`
    });
  };

  const handleEditItem = (item: JewelryItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleSaveEditedItem = (updatedItem: JewelryItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    toast({
      title: "Item Updated",
      description: `${updatedItem.name} has been updated successfully.`
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item Deleted",
      description: "Item has been removed from inventory.",
      variant: "destructive"
    });
  };

  const handleViewItem = (item: JewelryItem) => {
    setViewingItem(item);
    setShowViewDialog(true);
  };

  const handleAddToCart = (item: JewelryItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCartItems(prev => 
        prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      const cartItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type: item.type,
        metal: item.metal,
        gemstone: item.gemstone
      };
      setCartItems(prev => [...prev, cartItem]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${item.name} added to cart`
    });
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleTransactionComplete = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    toast({
      title: "Transaction Completed",
      description: `Payment of ₹${transaction.total.toLocaleString()} processed successfully`
    });
  };

  const handleAddCraftsman = (newCraftsman: Omit<Craftsman, 'id'>) => {
    const craftsman: Craftsman = {
      ...newCraftsman,
      id: Date.now().toString()
    };
    setCraftsmen([...craftsmen, craftsman]);
  };

  const handleUpdateCraftsman = (id: string, updates: Partial<Craftsman>) => {
    setCraftsmen(craftsmen.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCraftsman = (id: string) => {
    setCraftsmen(craftsmen.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        cartCount={cartCount}
      />
      
      {/* Header Section */}
      <header className="bg-gradient-to-r from-green-100 to-yellow-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Jewellery Management</h1>
          <p className="text-gray-600 text-lg">Track your Craftsmen, Inventory, Employees and More</p>
        </div>
      </header>

      <main>
        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-8">
            {/* Welcome Section - Main Card */}
            <section className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-600 mb-2">Welcome to Golden Treasures</h2>
                <p className="text-gray-600">Your one-stop shop for gold, stones, and jewelry.</p>
              </div>
              
              {/* Collection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gold Collection */}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-6 text-white flex flex-col items-center text-center">
                  <div 
                    className="h-32 w-full bg-cover bg-center rounded-lg mb-4"
                    style={{ backgroundImage: `url(${heroImage})` }}
                  />
                  <h3 className="text-xl font-bold text-green-600 mb-2">Gold Collection</h3>
                  <p className="text-green-500 text-sm">Explore our exquisite gold items.</p>
                </div>

                {/* Precious Stones */}
                <div className="bg-white border-2 border-green-200 rounded-lg p-6 flex flex-col items-center text-center">
                  <div 
                    className="h-32 w-full bg-gray-800 rounded-lg mb-4 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1631832724508-ea8df04ad455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxwcmVjaW91cy1zdG9uZXN8ZW58MXwwfHx8MTc1Mzc2NjkyMHww&ixlib=rb-4.0.3&q=80&w=1080')" }}
                  />
                  <h3 className="text-xl font-bold text-green-600 mb-2">Precious Stones</h3>
                  <p className="text-green-500 text-sm">Discover our rare and beautiful stones.</p>
                </div>

                {/* Jewelry */}
                <div className="bg-white border-2 border-green-200 rounded-lg p-6 flex flex-col items-center text-center">
                  <div 
                    className="h-32 w-full bg-cover bg-center rounded-lg mb-4"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5fGVufDF8MHx8fDE3NTM3NTkzMjh8MA&ixlib=rb-4.0.3&q=80&w=1080')" }}
                  />
                  <h3 className="text-xl font-bold text-green-600 mb-2">Jewelry</h3>
                  <p className="text-green-500 text-sm">Elegant and timeless pieces.</p>
                </div>
              </div>
            </section>

            {/* Search Section */}
            <section className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jewelry and gems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Items"
                value={totalItems.toString()}
                icon={Package}
                trend="+12% this month"
              />
              <StatsCard
                title="Total Value"
                value={`₹${totalValue.toLocaleString()}`}
                icon={DollarSign}
                trend="+8% this month" 
              />
              <StatsCard
                title="Unique Pieces"
                value={items.length.toString()}
                icon={Gem}
                trend="+3 new items"
              />
              <StatsCard
                title="Low Stock Alert"
                value={lowStockItems.toString()}
                icon={TrendingUp}
                trend={lowStockItems > 0 ? "Needs attention" : "All good"}
              />
            </section>

            {/* Inventory Grid */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
                <p className="text-gray-600">
                  {filteredItems.length} of {items.length} items
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <JewelryCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onView={handleViewItem}
                    onAddToCart={handleAddToCart}
                    showAddToCart={false}
                  />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Gem className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No items found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or add new jewelry items
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Craftsmen Tab */}
        {activeTab === "craftsmen" && (
          <CraftsmenManagement
            craftsmen={craftsmen}
            onAddCraftsman={handleAddCraftsman}
            onUpdateCraftsman={handleUpdateCraftsman}
            onDeleteCraftsman={handleDeleteCraftsman}
          />
        )}

        {/* Point of Sale Tab */}
        {activeTab === "pos" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Point of Sale</h2>
                <p className="text-gray-600">Select items and process transactions</p>
              </div>
              {cartItems.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleClearCart}
                    className="border-gray-300 text-gray-700 hover:border-gray-400"
                  >
                    Clear Cart
                  </Button>
                  <Button 
                    onClick={() => setShowTransactionDialog(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Checkout ({cartCount})
                  </Button>
                </div>
              )}
            </div>

            {/* Search */}
            <Card className="p-6 bg-white shadow-lg border border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items to add to cart..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </Card>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="font-semibold mb-4 text-green-800">Cart Summary</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <div className="flex gap-2 mt-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                            className="border-gray-300"
                          >
                            -
                          </Button>
                          <Badge variant="secondary">{item.quantity}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                            className="border-gray-300"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <span className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-green-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Items Grid for POS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <JewelryCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onView={handleViewItem}
                  onAddToCart={handleAddToCart}
                  showAddToCart={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AIAnalyticsDashboard />}

        {/* Employees Tab */}
        {activeTab === "employees" && <EmployeeManagement />}

        {/* Settings Tab */}
        {activeTab === "settings" && <BusinessSettings />}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportingDashboard />}

        {/* Customer Ledger Tab */}
        {activeTab === "ledger" && <CustomerLedger />}
      </main>

      {/* Dialogs */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddItem}
      />

        <EditItemDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleSaveEditedItem}
          item={editingItem}
        />

        <ViewItemDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          onEdit={handleEditItem}
          item={viewingItem}
        />

        <TransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        items={cartItems}
        onComplete={handleTransactionComplete}
        onClearCart={handleClearCart}
      />
    </div>
  );
};

export default Index;
