import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  console.log('🔄 App state:', { user: user?.email, loading, approved: user?.is_approved });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando sistema...</p>
          <p className="text-gray-400 text-sm mt-2">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_approved) {
    console.log('🔄 Showing auth page - user:', user?.email, 'approved:', user?.is_approved);
    return <AuthPage />;
  }

  console.log('✅ Showing dashboard for approved user:', user.email);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Dashboard />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;