import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Church, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenUserManagement?: () => void;
}

export function Header({ onOpenUserManagement }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Church className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Dispensa
              </h1>
              <p className="text-xs text-gray-500">
                Seminário Diocesano - São Miguel Paulista
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">
                {user?.is_super_admin ? 'Super Administrador' : 'Integrante'}
              </p>
            </div>

            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}