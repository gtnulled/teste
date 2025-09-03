import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats } from '../../types';
import { Package, TrendingDown, Calendar, AlertTriangle, XCircle } from 'lucide-react';

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalWithdrawals: 0,
    monthlyWithdrawals: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total items
      const { count: totalItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      // Get total withdrawals
      const { count: totalWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true });

      // Get monthly withdrawals (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .gte('withdrawn_at', startOfMonth.toISOString());

      // Get low stock items (between 0.1 and 5 kg/units)
      const { count: lowStockItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .gt('quantity', 0)
        .lte('quantity', 5);

      // Get out of stock items
      const { count: outOfStockItems } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('quantity', 0);

      setStats({
        totalItems: totalItems || 0,
        totalWithdrawals: totalWithdrawals || 0,
        monthlyWithdrawals: monthlyWithdrawals || 0,
        lowStockItems: lowStockItems || 0,
        outOfStockItems: outOfStockItems || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total de Itens',
      value: stats.totalItems.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Retiradas este Mês',
      value: stats.monthlyWithdrawals.toString(),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Sem Estoque',
      value: stats.outOfStockItems.toString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Total de Retiradas',
      value: stats.totalWithdrawals.toString(),
      icon: TrendingDown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-xl p-6 shadow-sm border ${card.borderColor} hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}