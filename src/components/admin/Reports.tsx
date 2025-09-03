import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Download, Calendar, TrendingUp, Package, Users } from 'lucide-react';

interface MonthlyReport {
  month: string;
  totalWithdrawals: number;
  totalQuantity: number;
  uniqueUsers: number;
  topItems: Array<{
    itemName: string;
    totalQuantity: number;
    withdrawalCount: number;
  }>;
}

export function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [selectedMonth]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Get withdrawals for the selected month
      const { data: withdrawals, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          item:items(name, unit),
          user:users(full_name)
        `)
        .gte('withdrawn_at', monthStart.toISOString())
        .lte('withdrawn_at', monthEnd.toISOString());

      if (error) throw error;

      // Process data
      const uniqueUsers = new Set(withdrawals?.map(w => w.user_id)).size;
      const totalQuantity = withdrawals?.reduce((sum, w) => sum + w.quantity, 0) || 0;

      // Calculate top items
      const itemStats = withdrawals?.reduce((acc, withdrawal) => {
        const itemName = withdrawal.item?.name || 'Item desconhecido';
        if (!acc[itemName]) {
          acc[itemName] = { totalQuantity: 0, withdrawalCount: 0 };
        }
        acc[itemName].totalQuantity += withdrawal.quantity;
        acc[itemName].withdrawalCount += 1;
        return acc;
      }, {} as Record<string, { totalQuantity: number; withdrawalCount: number }>) || {};

      const topItems = Object.entries(itemStats)
        .map(([itemName, stats]) => ({
          itemName,
          totalQuantity: stats.totalQuantity,
          withdrawalCount: stats.withdrawalCount,
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      setReport({
        month: `${monthNames[parseInt(month) - 1]} ${year}`,
        totalWithdrawals: withdrawals?.length || 0,
        totalQuantity,
        uniqueUsers,
        topItems,
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const csvContent = [
      ['Relatório Mensal da Dispensa'],
      [`Mês: ${report.month}`],
      [`Total de Retiradas: ${report.totalWithdrawals}`],
      [`Quantidade Total Retirada: ${report.totalQuantity}`],
      [`Usuários Únicos: ${report.uniqueUsers}`],
      [''],
      ['Itens Mais Retirados'],
      ['Item', 'Quantidade Total', 'Número de Retiradas'],
      ...report.topItems.map(item => [
        item.itemName,
        item.totalQuantity.toString(),
        item.withdrawalCount.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-dispensa-${selectedMonth}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Relatórios Mensais</h3>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {report && (
                <button
                  onClick={exportReport}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {report && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total de Retiradas</p>
                    <p className="text-2xl font-bold text-blue-900">{report.totalWithdrawals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <Package className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Quantidade Total</p>
                    <p className="text-2xl font-bold text-green-900">{report.totalQuantity.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Usuários Ativos</p>
                    <p className="text-2xl font-bold text-purple-900">{report.uniqueUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Média por Usuário</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {report.uniqueUsers > 0 ? (report.totalWithdrawals / report.uniqueUsers).toFixed(1) : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {report.topItems.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Itens Mais Retirados em {report.month}
                </h4>
                <div className="space-y-3">
                  {report.topItems.map((item, index) => (
                    <div
                      key={item.itemName}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{item.itemName}</h5>
                          <p className="text-sm text-gray-600">
                            {item.withdrawalCount} retirada{item.withdrawalCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {item.totalQuantity.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">total retirado</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}