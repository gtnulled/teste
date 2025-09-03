import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Item } from '../../types';
import { X, Minus, Package } from 'lucide-react';

interface WithdrawItemModalProps {
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawItemModal({ itemId, onClose, onSuccess }: WithdrawItemModalProps) {
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    const withdrawQuantity = parseFloat(quantity);
    if (withdrawQuantity > item.quantity) {
      setError('Quantidade a retirar é maior que o estoque disponível.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create withdrawal record
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          item_id: itemId,
          user_id: user.id,
          quantity: withdrawQuantity,
        });

      if (withdrawalError) throw withdrawalError;

      // Update item quantity
      const { error: updateError } = await supabase
        .from('items')
        .update({
          quantity: item.quantity - withdrawQuantity,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      onSuccess();
    } catch (error) {
      console.error('Error recording withdrawal:', error);
      setError('Erro ao registrar retirada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Minus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Retirar Item</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  Disponível: {item.quantity} {item.unit}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade a Retirar ({item.unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`Máximo ${item.quantity} ${item.unit}`}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Registrando...' : 'Confirmar Retirada'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}