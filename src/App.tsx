import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Checklist from "./pages/Checklist";
import DespesasCNPJ from "./pages/DespesasCNPJ";
import Boletos from "./pages/Boletos";
import Compras from "./pages/Compras";
import Cotacao from "./pages/Cotacao";
import Separacoes from "./pages/Separacoes";
import FundoCaixa from "./pages/FundoCaixa";
import ConfiguracoesDRE from "./pages/ConfiguracoesDRE";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

// Admin
import { AdminProtectedRoute } from "./components/auth/AdminProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminLogs } from "./pages/admin/AdminLogs";
import AdminLogin from "./pages/admin/AdminLogin";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // Validação contínua a cada mudança de rota (caso o admin bloqueie enquanto navega)
  useEffect(() => {
    if (user && isAuthenticated) {
      supabase.from('profiles').select('status').eq('id', user.id).single()
        .then(({ data }) => {
          if (data && (data.status === 'bloqueado' || data.status === 'pausado')) {
             logout();
          }
        });
    }
  }, [user, location.pathname, isAuthenticated, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-subtle text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklist"
        element={
          <ProtectedRoute>
            <Checklist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despesas-cnpj"
        element={
          <ProtectedRoute>
            <DespesasCNPJ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boletos"
        element={
          <ProtectedRoute>
            <Boletos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <Compras />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotacao"
        element={
          <ProtectedRoute>
            <Cotacao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/separacoes"
        element={
          <ProtectedRoute>
            <Separacoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fundo-caixa"
        element={
          <ProtectedRoute>
            <FundoCaixa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes-dre"
        element={
          <ProtectedRoute>
            <ConfiguracoesDRE />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      
      {/* Rotas Administrativas (SaaS) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FinanceProvider>
            <AppRoutes />
          </FinanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
