import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCards } from './StatsCards';
import { ItemList } from '../items/ItemList';
import { WithdrawalHistory } from '../withdrawals/WithdrawalHistory';
import { AddItemModal } from '../items/AddItemModal';
import { WithdrawItemModal } from '../withdrawals/WithdrawItemModal';
import { UserManagement } from '../admin/UserManagement';
import { Reports } from '../admin/Reports';
import { Package, FileText, Users, Plus } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'withdrawals' | 'users' | 'reports'>('items');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showWithdrawItem, setShowWithdrawItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWithdrawItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowWithdrawItem(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'items' as const, name: 'Itens da Dispensa', icon: Package, visible: true },
    { id: 'withdrawals' as const, name: 'Histórico de Retiradas', icon: FileText, visible: true },
    { id: 'users' as const, name: 'Gerenciar Usuários', icon: Users, visible: user?.is_super_admin },
    { id: 'reports' as const, name: 'Relatórios', icon: FileText, visible: user?.is_super_admin },
  ].filter(tab => tab.visible);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards key={refreshKey} />

        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } transition-colors duration-200`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'items' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Itens da Dispensa</h2>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>
                <ItemList key={refreshKey} onWithdrawItem={handleWithdrawItem} />
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Retiradas</h2>
                <WithdrawalHistory key={refreshKey} />
              </div>
            )}

            {activeTab === 'users' && user?.is_super_admin && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Usuários</h2>
                <UserManagement key={refreshKey} />
              </div>
            )}

            {activeTab === 'reports' && user?.is_super_admin && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h2>
                <Reports />
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSuccess={() => {
            setShowAddItem(false);
            handleRefresh();
          }}
        />
      )}

      {showWithdrawItem && selectedItemId && (
        <WithdrawItemModal
          itemId={selectedItemId}
          onClose={() => {
            setShowWithdrawItem(false);
            setSelectedItemId(null);
          }}
          onSuccess={() => {
            setShowWithdrawItem(false);
            setSelectedItemId(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}