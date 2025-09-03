import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Withdrawal } from '../../types';
import { Calendar, Package, User } from 'lucide-react';

export function WithdrawalHistory() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          item:items(*),
          user:users(full_name)
        `)
        .order('withdrawn_at', { ascending: false });

      // If not super admin, only show own withdrawals
      if (!user?.is_super_admin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          {user?.is_super_admin ? 'Todas as Retiradas' : 'Minhas Retiradas'} ({withdrawals.length})
        </h3>
      </div>

      <div className="p-6">
        {withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {user?.is_super_admin ? 'Nenhuma retirada registrada ainda' : 'Você ainda não fez nenhuma retirada'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {withdrawal.item?.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          Retirado: {withdrawal.quantity} {withdrawal.item?.unit}
                        </span>
                        {user?.is_super_admin && withdrawal.user && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{withdrawal.user.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(withdrawal.withdrawn_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}