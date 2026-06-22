import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0,
    recentTransactions: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: products } = await api.get('/products');
        const { data: transactions } = await api.get('/inventory');
        
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
        const lowStock = products.filter(p => p.stock <= p.reorderPoint).length;

        setStats({
          totalProducts: products.length,
          lowStock,
          totalValue,
          recentTransactions: transactions.slice(0, 5)
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: <Package size={24} className="text-blue-400" />, bg: 'bg-blue-400/10' },
    { title: 'Low Stock Items', value: stats.lowStock, icon: <AlertTriangle size={24} className="text-amber-400" />, bg: 'bg-amber-400/10' },
    { title: 'Inventory Value', value: `$${stats.totalValue.toLocaleString()}`, icon: <DollarSign size={24} className="text-emerald-400" />, bg: 'bg-emerald-400/10' },
    { title: 'Total Movements', value: stats.recentTransactions.length, icon: <TrendingUp size={24} className="text-purple-400" />, bg: 'bg-purple-400/10' },
  ];

  const mockChartData = [
    { name: 'Jan', in: 400, out: 240 },
    { name: 'Feb', in: 300, out: 139 },
    { name: 'Mar', in: 200, out: 980 },
    { name: 'Apr', in: 278, out: 390 },
    { name: 'May', in: 189, out: 480 },
    { name: 'Jun', in: 239, out: 380 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textMain mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-surface border border-slate-700/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textMuted mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-textMain">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-surface border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-textMain mb-4">Stock Movement</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="in" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stock In" />
                <Bar dataKey="out" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Stock Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-textMain mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div>
                    <p className="font-medium text-sm text-textMain">{tx.product?.name || 'Unknown'}</p>
                    <p className="text-xs text-textMuted">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-textMuted text-sm text-center py-4">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
