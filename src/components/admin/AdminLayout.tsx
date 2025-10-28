import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, Users, ShoppingCart, Warehouse, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/produtos', icon: Package, label: 'Produtos' },
    { path: '/admin/clientes', icon: Users, label: 'Clientes' },
    { path: '/admin/vendas', icon: ShoppingCart, label: 'Vendas' },
    { path: '/admin/estoque', icon: Warehouse, label: 'Estoque' },
  ];

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">Admin</h1>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
