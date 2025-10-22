import { useState, useEffect } from "react";
import { JewelryCard, JewelryItem } from "@/components/JewelryCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Receipt, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  DollarSign,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { generateReceiptPDF, ReceiptData } from "@/lib/pdfGenerator";
import ItemDetailsDialog from "@/components/ItemDetailsDialog";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

interface Invoice {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  customerName?: string;
  paymentMethod: string;
}

const POS = () => {
  const { toast } = useToast();
  const { data: cart, updateData: setCart } = useOfflineStorage<CartItem[]>("pos_cart", []);
  const { data: customerName, updateData: setCustomerName } = useOfflineStorage<string>("pos_customerName", "");
  const { data: recentInvoices, updateData: setRecentInvoices } = useOfflineStorage<Invoice[]>("pos_recentInvoices", []);
  const { data: businessSettings } = useOfflineStorage('businessSettings', {
    businessName: "Golden Treasures",
    address: "123 Jewelry Street, Mumbai",
    phone: "+91 98765 43210",
    email: "info@goldentreasures.com",
    gstNumber: "27XXXXX1234X1Z5",
    currency: "INR",
    timezone: "Asia/Kolkata"
  });
  const { data: paymentSettings } = useOfflineStorage('paymentSettings', {
    upiId: "goldentreasures@paytm",
    businessName: "Golden Treasures Pvt Ltd",
    gstNumber: "27XXXXX1234X1Z5",
    bankAccount: "1234567890123456",
    ifscCode: "HDFC0001234"
  });
  
  // Read the same inventory collection used by Home page - using standardized key
  const { data: availableItems, updateData: setAvailableItems, loaded: itemsLoaded } = useOfflineStorage<JewelryItem[]>("jewelry_items", []);
  
  // Debug logging
  useEffect(() => {
    console.log('POS Debug - availableItems:', availableItems);
    console.log('POS Debug - itemsLoaded:', itemsLoaded);
    console.log('POS Debug - availableItems.length:', availableItems?.length || 0);
  }, [availableItems, itemsLoaded]);
  const [selected, setSelected] = useState<JewelryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpi, setShowUpi] = useState(false);
  const [upiUrl, setUpiUrl] = useState("");

  const addToCart = (item: JewelryItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type: item.type }];
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const processPayment = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before processing payment.",
        variant: "destructive"
      });
      return;
    }

    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax,
      total,
      date: new Date().toISOString(),
      customerName: customerName || "Walk-in Customer",
      paymentMethod
    };

    setRecentInvoices(prev => [invoice, ...prev.slice(0, 4)]);

    // Decrement stock in shared inventory
    try {
      const updated = availableItems.map(it => {
        const sold = cart.find(c => c.id === it.id);
        if (!sold) return it;
        const newQty = Math.max(0, (it.inStock ?? 0) - sold.quantity);
        return { ...it, inStock: newQty } as JewelryItem;
      });
      await setAvailableItems(updated);
    } catch (e) {
      console.error("Failed to update inventory stock after sale", e);
    }

    setCart([]);
    setCustomerName("");

    // Generate and download PDF receipt
    try {
      const receiptData: ReceiptData = {
        invoiceId: invoice.id,
        businessName: businessSettings.businessName,
        businessAddress: businessSettings.address,
        businessPhone: businessSettings.phone,
        businessEmail: businessSettings.email,
        gstNumber: businessSettings.gstNumber,
        customerName: invoice.customerName,
        items: invoice.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        paymentMethod: invoice.paymentMethod,
        date: invoice.date,
        upiId: paymentSettings.upiId
      };

      await generateReceiptPDF(receiptData);
      
      toast({
        title: "Payment Processed",
        description: `Invoice ${invoice.id} has been generated and receipt downloaded.`
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Payment Processed",
        description: `Invoice ${invoice.id} has been generated successfully.`,
        variant: "destructive"
      });
    }
  };

  const openUpiModal = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart before processing payment.", variant: "destructive" });
      return;
    }
    const pa = paymentSettings.upiId || "";
    const pn = businessSettings.businessName || "";
    const am = total.toFixed(2);
    const tn = `POS payment ${new Date().toLocaleDateString()}`;
    const url = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(tn)}`;
    setUpiUrl(url);
    setShowUpi(true);
  };

  return (
    <div className="min-h-screen bg-gradient-elegant">
      
      <header className="bg-gradient-primary shadow-elegant border-b border-border/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Point of Sale</h1>
              <p className="text-primary-foreground/70 text-sm">Process sales and generate invoices</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-accent text-accent-foreground">
                Terminal: POS-001
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Quick Add Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No inventory items available</p>
                    <p className="text-sm text-muted-foreground">
                      Items will appear here once inventory is loaded from IndexedDB
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Debug: {availableItems.length} items found | Loaded: {itemsLoaded ? 'Yes' : 'No'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Key: jewelry_items | Check console for detailed logs
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {availableItems.map(item => (
                      <JewelryCard
                        key={item.id}
                        item={item}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onView={(it) => { setSelected(it); setShowDetails(true); }}
                        onAddToCart={addToCart}
                        showAddToCart={true}
                        showActions={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card className="bg-card shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentInvoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent invoices</p>
                ) : (
                  <div className="space-y-3">
                    {recentInvoices.map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{invoice.id}</p>
                          <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{invoice.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{invoice.paymentMethod}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="bg-card shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="bg-card shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cart ({cart.length} items)</span>
                  {cart.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCart([])}
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Cart is empty</p>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-4 pr-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString()} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Checkout */}
            {cart.length > 0 && (
              <Card className="bg-card shadow-card border-border/50">
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (8%):</span>
                      <span className="font-medium">₹{tax.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-gold hover:bg-gold-dark text-primary transition-smooth"
                      onClick={() => processPayment("Cash")}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Cash Payment
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={openUpiModal}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      UPI Payment
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => processPayment("Card")}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      <ItemDetailsDialog
        item={selected}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />

      {/* UPI Modal */}
      <Dialog open={showUpi} onOpenChange={setShowUpi}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Scan & Pay (UPI)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p><span className="font-medium">Payee:</span> {businessSettings.businessName}</p>
              <p><span className="font-medium">UPI ID:</span> {paymentSettings.upiId}</p>
              <p><span className="font-medium">Amount:</span> ₹{total.toLocaleString()}</p>
            </div>
            <div className="w-full flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`}
                alt="UPI QR"
                className="border rounded"
              />
            </div>
            <div className="text-center text-xs text-muted-foreground">
              If you are on mobile, you can also open a UPI app directly.
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <a href={upiUrl} className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm" target="_blank" rel="noreferrer">Open UPI App</a>
            <Button onClick={() => { setShowUpi(false); processPayment("UPI"); }}>
              Payment Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;