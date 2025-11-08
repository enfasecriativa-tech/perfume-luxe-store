import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/CustomerDashboard";
import Cart from "./pages/Cart";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSales from "./pages/admin/AdminSales";
import AdminStock from "./pages/admin/AdminStock";
import AdminAccount from "./pages/admin/AdminAccount";
import AdminAccess from "./pages/admin/AdminAccess";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBanners from "./pages/admin/AdminBanners";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/produto/:id" element={<ProductDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/minha-conta" element={<CustomerDashboard />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/produtos" element={<ProtectedRoute><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute><AdminLayout><AdminCustomers /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/vendas" element={<ProtectedRoute><AdminLayout><AdminSales /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/estoque" element={<ProtectedRoute><AdminLayout><AdminStock /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/configuracoes" element={<ProtectedRoute><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/banners" element={<ProtectedRoute><AdminLayout><AdminBanners /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/minha-conta" element={<ProtectedRoute><AdminLayout><AdminAccount /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/acessos" element={<ProtectedRoute><AdminLayout><AdminAccess /></AdminLayout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
