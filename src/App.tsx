import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import React, { Suspense } from "react";

// Lazy load pages
const Home = React.lazy(() => import("./pages/Home"));
const Products = React.lazy(() => import("./pages/Products"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const Auth = React.lazy(() => import("./pages/Auth"));
const CustomerDashboard = React.lazy(() => import("./pages/CustomerDashboard"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = React.lazy(() => import("./pages/admin/AdminProducts"));
const AdminSales = React.lazy(() => import("./pages/admin/AdminSales"));
const AdminStock = React.lazy(() => import("./pages/admin/AdminStock"));
const AdminAccount = React.lazy(() => import("./pages/admin/AdminAccount"));
const AdminAccess = React.lazy(() => import("./pages/admin/AdminAccess"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const AdminBanners = React.lazy(() => import("./pages/admin/AdminBanners"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/minha-conta" element={<CustomerDashboard />} />
              <Route path="/carrinho" element={<Cart />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/produtos" element={<ProtectedRoute><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/vendas" element={<ProtectedRoute><AdminLayout><AdminSales /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/estoque" element={<ProtectedRoute><AdminLayout><AdminStock /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/banners" element={<ProtectedRoute><AdminLayout><AdminBanners /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/minha-conta" element={<ProtectedRoute><AdminLayout><AdminAccount /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/acessos" element={<ProtectedRoute><AdminLayout><AdminAccess /></AdminLayout></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
