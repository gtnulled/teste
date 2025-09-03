import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Item } from '../../types';
import { Package, AlertTriangle, XCircle, Trash2, Edit3, Minus } from 'lucide-react';

interface ItemListProps {
  onWithdrawItem: (itemId: string) => void;
}

export function ItemList({ onWithdrawItem }: ItemListProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRemoval = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({
          removal_requested: true,
          requested_by: user.id,
          requested_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error requesting removal:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user?.is_super_admin) return;

    const confirmed = window.confirm('Tem certeza que deseja remover este item permanentemente?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) {
      return {
        status: 'out-of-stock',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: XCircle,
        message: 'Sem estoque',
      };
    }
    if (item.quantity <= 5) {
      return {
        status: 'low-stock',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: AlertTriangle,
        message: 'Estoque baixo',
      };
    }
    return {
      status: 'in-stock',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: Package,
      message: 'Em estoque',
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Inventário da Dispensa ({items.length} itens)
        </h3>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum item cadastrado ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const stockStatus = getStockStatus(item);
              const StatusIcon = stockStatus.icon;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${
                    item.removal_requested ? 'border-orange-200 bg-orange-25' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stockStatus.bgColor}`}>
                        <StatusIcon className={`w-6 h-6 ${stockStatus.color}`} />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{item.quantity} {item.unit}</span>
                          {item.category && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {item.category}
                            </span>
                          )}
                          <span className={`${stockStatus.color} font-medium`}>
                            {stockStatus.message}
                          </span>
                        </div>
                        {item.removal_requested && (
                          <p className="text-sm text-orange-600 mt-1">
                            Remoção solicitada
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.quantity > 0 && !item.removal_requested && (
                        <button
                          onClick={() => onWithdrawItem(item.id)}
                          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <Minus className="w-4 h-4" />
                          <span>Retirar</span>
                        </button>
                      )}

                      {user?.is_super_admin ? (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        !item.removal_requested && (
                          <button
                            onClick={() => handleRequestRemoval(item.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                            title="Solicitar remoção"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}