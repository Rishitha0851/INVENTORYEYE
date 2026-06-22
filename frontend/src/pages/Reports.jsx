import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  FileText, Download, TrendingUp, Package, AlertCircle, ShieldCheck,
  Zap, PieChart as PieIcon, Activity, ArrowRight, Printer,
  Brain, AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [inventoryReport, setInventoryReport] = useState(null);
  const [forecastReport, setForecastReport] = useState(null);
  const [recReport, setRecReport] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);

  useEffect(() => {
    const fetchAllReports = async () => {
      setLoading(true);
      try {
        const [invRes, forRes, recRes, sumRes] = await Promise.all([
          api.get('/reports/inventory'),
          api.get('/reports/forecast'),
          api.get('/reports/recommendations'),
          api.get('/reports/summary')
        ]);
        setInventoryReport(invRes.data.data); // data wrapped in the report schema
        setForecastReport(forRes.data.data);
        setRecReport(recRes.data.data);
        setSummaryReport(sumRes.data.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  // ── CSV Exporters ──
  const exportCSV = (data, filename, columns, dataMapper) => {
    if (!data || !data.length) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + columns.join(",") + "\n" 
      + data.map(row => dataMapper(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (activeTab === 'inventory' && inventoryReport) {
      exportCSV(inventoryReport.products, 'inventory_report.csv', 
        ['Product', 'Category', 'Stock', 'Price', 'Status'],
        r => [`"${r.name}"`, `"${r.category}"`, r.stock, r.price, r.status]
      );
    } else if (activeTab === 'forecast' && forecastReport) {
      exportCSV(forecastReport.forecasts, 'forecast_report.csv',
        ['Product', 'Weekly Demand', 'Monthly Demand', 'Confidence', 'Trend'],
        r => [`"${r.name}"`, r.weeklyDemand, r.monthlyDemand, r.confidence, r.trend]
      );
    } else if (activeTab === 'recommendation' && recReport) {
      exportCSV(recReport.recommendations, 'recommendation_report.csv',
        ['Product', 'Priority', 'Current Stock', 'Recommended Qty', 'Supplier'],
        r => [`"${r.name}"`, r.priority, r.currentStock, r.recommendedQuantity, `"${r.supplier}"`]
      );
    }
  };

  // ── PDF Exporters ──
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    // Global Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('InventoryEye Enterprise', 105, 20, null, null, 'center');
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text(`${activeTab.toUpperCase()} REPORT`, 105, 28, null, null, 'center');
    doc.setFontSize(10);
    doc.text(`Generated: ${dateStr}`, 105, 34, null, null, 'center');

    if (activeTab === 'inventory' && inventoryReport) {
      doc.autoTable({
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
          ['Total Products', inventoryReport.totalProducts],
          ['Total Value ($)', `$${inventoryReport.totalValue.toLocaleString()}`],
          ['Low Stock Count', inventoryReport.lowStockCount],
          ['Out of Stock', inventoryReport.outOfStockCount]
        ],
        theme: 'grid'
      });
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Product', 'Category', 'Stock', 'Status', 'Value']],
        body: inventoryReport.products.map(p => [
          p.name, p.category, p.stock, p.status, `$${p.value}`
        ])
      });
      doc.save('Inventory_Report.pdf');

    } else if (activeTab === 'forecast' && forecastReport) {
      doc.autoTable({
        startY: 45,
        head: [['Total Weekly Demand', 'Total Monthly Demand', 'Avg Confidence']],
        body: [[forecastReport.totalWeeklyDemand, forecastReport.totalMonthlyDemand, `${forecastReport.avgConfidence}%`]],
        theme: 'grid'
      });
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Product', 'Weekly Forecast', 'Monthly Forecast', 'Trend', 'Confidence']],
        body: forecastReport.forecasts.map(f => [
          f.name, f.weeklyDemand, f.monthlyDemand, f.trend, `${f.confidence}%`
        ])
      });
      doc.save('Forecast_Report.pdf');

    } else if (activeTab === 'recommendation' && recReport) {
      doc.autoTable({
        startY: 45,
        head: [['Total Recs', 'Critical Reorders', 'High Priority', 'Total Order Volume']],
        body: [[
          recReport.totalRecommendations, 
          recReport.criticalCount, 
          recReport.highCount, 
          recReport.totalRecommendedQuantity
        ]],
        theme: 'grid'
      });
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Product', 'Priority', 'Stock', 'Rec Qty', 'Supplier']],
        body: recReport.recommendations.map(r => [
          r.name, r.priority, r.currentStock, r.recommendedQuantity, r.supplier
        ])
      });
      doc.save('Recommendations_Report.pdf');

    } else if (activeTab === 'summary' && summaryReport) {
      doc.autoTable({
        startY: 45,
        head: [['Health Score', 'Forecast Accuracy', 'Products At Risk', 'Critical Orders', 'Inventory Value']],
        body: [[
          `${summaryReport.inventoryHealthScore}%`,
          `${summaryReport.forecastAccuracy}%`,
          summaryReport.productsAtRisk,
          summaryReport.criticalReorders,
          `$${summaryReport.totalInventoryValue.toLocaleString()}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('AI Executive Insights:', 14, doc.lastAutoTable.finalY + 20);
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      let y = doc.lastAutoTable.finalY + 30;
      summaryReport.insights.forEach(ins => {
        doc.text(`• ${ins}`, 14, y);
        y += 8;
      });
      doc.save('Executive_Summary.pdf');
    }
  };

  // ── Render Helpers ──
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm z-50">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500 animate-pulse">Compiling reports...</div>;
  }

  if (error) {
    return <div className="flex h-64 items-center justify-center text-red-500 bg-red-50 rounded-xl p-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieIcon size={24} className="text-indigo-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise intelligence and data exports</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== 'summary' && (
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download size={15} /> CSV
            </button>
          )}
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Printer size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'forecast', label: 'Forecast', icon: TrendingUp },
          { id: 'recommendation', label: 'Recommendations', icon: AlertCircle },
          { id: 'summary', label: 'Executive Summary', icon: Activity }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === t.id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        
        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && inventoryReport && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Products</p>
                <p className="text-2xl font-bold text-slate-800">{inventoryReport.totalProducts}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Inventory Value</p>
                <p className="text-2xl font-bold text-slate-800">${inventoryReport.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{inventoryReport.lowStockCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryReport.outOfStockCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-80 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(inventoryReport.categoryDistribution).map(([n,v]) => ({name:n, value:v}))} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                      {Object.keys(inventoryReport.categoryDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-80 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Top 5 Products by Value</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...inventoryReport.products].sort((a,b)=>b.value-a.value).slice(0,5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{fontSize: 12}} />
                    <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3b82f6" name="Value ($)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Inventory Status Report</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4">Value</th></tr>
                  </thead>
                  <tbody>
                    {inventoryReport.products.map(p => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 text-slate-500">{p.category}</td>
                        <td className="p-4 font-bold">{p.stock}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${p.status==='Out of Stock'?'bg-red-100 text-red-700':p.status==='Low Stock'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{p.status}</span>
                        </td>
                        <td className="p-4 text-slate-600">${p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FORECAST TAB */}
        {activeTab === 'forecast' && forecastReport && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 shadow-sm text-white">
                <p className="text-indigo-100 text-xs font-medium uppercase mb-1">Global Weekly Demand</p>
                <p className="text-3xl font-bold">{forecastReport.totalWeeklyDemand} units</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-sm text-white">
                <p className="text-blue-100 text-xs font-medium uppercase mb-1">Global Monthly Demand</p>
                <p className="text-3xl font-bold">{forecastReport.totalMonthlyDemand} units</p>
              </div>
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 shadow-sm text-white">
                <p className="text-slate-300 text-xs font-medium uppercase mb-1">System Accuracy</p>
                <p className="text-3xl font-bold">{forecastReport.avgConfidence}%</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-80 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Product Demand Forecasts</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastReport.forecasts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="monthlyDemand" stroke="#6366f1" fill="#818cf8" fillOpacity={0.3} name="Monthly Demand" />
                  <Area type="monotone" dataKey="weeklyDemand" stroke="#10b981" fill="#34d399" fillOpacity={0.3} name="Weekly Demand" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Forecast Registry</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <tr><th className="p-4">Product</th><th className="p-4">Weekly Demand</th><th className="p-4">Monthly Demand</th><th className="p-4">Trend</th><th className="p-4">Confidence</th></tr>
                  </thead>
                  <tbody>
                    {forecastReport.forecasts.map(f => (
                      <tr key={f.id} className="border-b border-slate-50">
                        <td className="p-4 font-medium">{f.name}</td>
                        <td className="p-4 text-indigo-600 font-bold">{f.weeklyDemand}</td>
                        <td className="p-4 text-blue-600 font-bold">{f.monthlyDemand}</td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 ${f.trend==='Up'?'text-emerald-500':f.trend==='Down'?'text-red-500':'text-slate-500'}`}>
                            {f.trend === 'Up' ? '↑' : f.trend === 'Down' ? '↓' : '→'} {f.trend}
                          </span>
                        </td>
                        <td className="p-4">{f.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDATION TAB */}
        {activeTab === 'recommendation' && recReport && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Actions</p>
                <p className="text-2xl font-bold text-slate-800">{recReport.totalRecommendations}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-b-4 border-red-500">
                <p className="text-xs font-medium text-red-500 uppercase mb-1">Critical Orders</p>
                <p className="text-2xl font-bold text-slate-800">{recReport.criticalCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-b-4 border-amber-500">
                <p className="text-xs font-medium text-amber-500 uppercase mb-1">High Priority</p>
                <p className="text-2xl font-bold text-slate-800">{recReport.highCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Volume to Order</p>
                <p className="text-2xl font-bold text-indigo-600">{recReport.totalRecommendedQuantity}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Action Plan</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <tr><th className="p-4">Product</th><th className="p-4">Priority</th><th className="p-4">Stock</th><th className="p-4">Rec Qty</th><th className="p-4">Days Left</th><th className="p-4">Supplier</th></tr>
                  </thead>
                  <tbody>
                    {recReport.recommendations.map(r => (
                      <tr key={r.id} className="border-b border-slate-50">
                        <td className="p-4 font-medium">{r.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${r.priority==='Critical'?'bg-red-100 text-red-700':r.priority==='High'?'bg-orange-100 text-orange-700':'bg-emerald-100 text-emerald-700'}`}>{r.priority}</span>
                        </td>
                        <td className="p-4">{r.currentStock}</td>
                        <td className="p-4 font-bold text-indigo-600">{r.recommendedQuantity}</td>
                        <td className="p-4">{r.daysRemaining ?? '—'}</td>
                        <td className="p-4 text-slate-500">{r.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXECUTIVE SUMMARY TAB */}
        {activeTab === 'summary' && summaryReport && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Master KPIs Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-indigo-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Products</p>
                <p className="text-2xl font-bold text-slate-800">{summaryReport.totalProducts}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Inventory Value</p>
                <p className="text-2xl font-bold text-emerald-600">${summaryReport.totalInventoryValue.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Low Stock Count</p>
                <p className="text-2xl font-bold text-amber-600">{summaryReport.lowStockCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Out of Stock Count</p>
                <p className="text-2xl font-bold text-red-600">{summaryReport.outOfStockCount}</p>
              </div>
            </div>

            {/* Master KPIs Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-blue-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Forecast Demand</p>
                <p className="text-2xl font-bold text-slate-800">{summaryReport.totalForecastDemand}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-purple-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Forecast Confidence</p>
                <p className="text-2xl font-bold text-purple-600">{summaryReport.forecastAccuracy}%</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-pink-500">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total Reorders</p>
                <p className="text-2xl font-bold text-pink-600">{summaryReport.totalRecommendations}</p>
              </div>
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
                <Zap size={60} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/5" />
                <p className="text-indigo-200 text-xs font-medium uppercase mb-1">Inventory Health</p>
                <p className={`text-3xl font-black ${summaryReport.inventoryHealthScore >= 80 ? 'text-emerald-400' : summaryReport.inventoryHealthScore >= 60 ? 'text-blue-400' : 'text-red-400'}`}>
                  {summaryReport.inventoryHealthScore}%
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Inventory Distribution</h3>
                {summaryReport.inventoryDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summaryReport.inventoryDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {summaryReport.inventoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Forecast Trend</h3>
                {summaryReport.forecastTrends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryReport.forecastTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="demand" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Recommendation Priority</h3>
                {summaryReport.priorityDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summaryReport.priorityDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {summaryReport.priorityDistribution.map((entry, index) => {
                          const priorityColors = { Critical: '#ef4444', High: '#f59e0b', Medium: '#eab308', Low: '#10b981' };
                          return <Cell key={`cell-${index}`} fill={priorityColors[entry.name] || '#94a3b8'} />;
                        })}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
                )}
              </div>

            </div>

            {/* AI Insights Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Brain size={18} className="text-indigo-600" />
                Executive Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaryReport.insights.map((insight, i) => (
                  <div key={i} className="flex gap-3 items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="mt-0.5 flex-shrink-0">
                      {insight.toLowerCase().includes('critical') || insight.toLowerCase().includes('risk') || insight.toLowerCase().includes('out of stock') ? (
                        <div className="w-2.5 h-2.5 mt-1 rounded-full bg-red-500 animate-pulse"></div>
                      ) : (
                        <div className="w-2.5 h-2.5 mt-1 rounded-full bg-emerald-500"></div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
