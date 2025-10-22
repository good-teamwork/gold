import { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";
  const supabase = getSupabase();
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    } finally {
      try { toast({ title: "Signed out", description: "You have been logged out." }); } catch {}
      window.location.href = "/auth";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isAuthRoute && (
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      )}
      
      {/* Mobile Sidebar */}
      {!isAuthRoute && (
        <MobileSidebar 
          isOpen={mobileSidebarOpen} 
          onClose={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${!isAuthRoute ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
        ml-0
      `}>
        {/* Top Bar */}
        {!isAuthRoute && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileSidebar}
              className="lg:hidden h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Jewellery Management System
                </h1>
                <p className="text-sm text-gray-500">Professional jewelry inventory management</p>
              </div>
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold text-gray-900">
                  Jewellery Management
                </h1>
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live</span>
              </div>
              <div className="text-sm text-gray-500 hidden md:block">
                {new Date().toLocaleDateString()}
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Page Content */}
        {isAuthRoute ? (
          <main className="min-h-screen bg-gray-900">
            <Outlet />
          </main>
        ) : (
          <main className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
