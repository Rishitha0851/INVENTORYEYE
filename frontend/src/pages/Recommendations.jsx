import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertCircle, ArrowRight, Brain, AlertTriangle, ShieldCheck,
  RefreshCw, Package, Lightbulb, Zap, Download, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PRIORITY_COLORS = {
  Critical: '#ef4444', // red
  High: '#f59e0b', // orange
  Medium: '#eab308', // yellow
  Low: '#10b981', // green
};

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recommendations');
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/recommendations/generate');
      await fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { fetchRecommendations(); }, []);

  // ── Derived KPIs ──
  const kpis = useMemo(() => {
    const total = recommendations.length;
    const critical = recommendations.filter(r => r.reorderPriority === 'Critical').length;
    const high = recommendations.filter(r => r.reorderPriority === 'High').length;
    const stockout = recommendations.filter(r => r.estimatedDaysRemaining !== null && r.estimatedDaysRemaining <= 7).length;
    return { total, critical, high, stockout };
  }, [recommendations]);

  // ── Health Score ──
  const healthScore = useMemo(() => {
    if (!recommendations.length) return { score: 100, status: 'Excellent', color: '#10b981' };
    const critical = recommendations.filter(r => r.reorderPriority === 'Critical').length;
    const high = recommendations.filter(r => r.reorderPriority === 'High').length;
    
    let score = 100 - (critical * 10) - (high * 5);
    score = Math.max(0, score);
    
    if (score >= 80) return { score, status: 'Excellent', color: '#10b981' };
    if (score >= 60) return { score, status: 'Good', color: '#3b82f6' };
    if (score >= 40) return { score, status: 'Warning', color: '#f59e0b' };
    return { score, status: 'Critical', color: '#ef4444' };
  }, [recommendations]);

  // ── Chart Data ──
  const priorityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    recommendations.forEach(r => { counts[r.reorderPriority]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [recommendations]);

  const riskData = useMemo(() => {
    // Top 5 products with lowest days remaining
    return [...recommendations]
      .filter(r => r.estimatedDaysRemaining !== null)
      .sort((a, b) => a.estimatedDaysRemaining - b.estimatedDaysRemaining)
      .slice(0, 5)
      .map(r => ({
        name: r.productName.substring(0, 10) + '...',
        days: r.estimatedDaysRemaining
      }));
  }, [recommendations]);

  const globalInsights = useMemo(() => {
    return [...recommendations]
      .sort((a, b) => {
        const priorityScore = { Critical: 3, High: 2, Medium: 1, Low: 0 };
        return priorityScore[b.reorderPriority] - priorityScore[a.reorderPriority];
      })
      .slice(0, 6)
      .map(r => r.recommendationReason);
  }, [recommendations]);

  // ── Export CSV ──
  const exportCSV = () => {
    const headers = ['Product', 'Stock', 'Threshold', 'Forecast Weekly', 'Days Remaining', 'Recommended Qty', 'Priority', 'Confidence'];
    const rows = recommendations.map(r => [
      `"${r.productName}"`, r.currentStock, r.minimumThreshold, r.predictedWeeklyDemand, 
      r.estimatedDaysRemaining ?? 'N/A', r.recommendedOrderQuantity, r.reorderPriority, r.confidenceScore
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `recommendations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Generate PDF ──
  const generatePDF = (rec) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('PURCHASE ORDER', 105, 20, null, null, 'center');
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`PO Number: PO-${Math.floor(Math.random() * 100000)}`, 20, 42);
    
    doc.text(`Supplier: ${rec.supplier || 'N/A'}`, 140, 35);
    doc.text(`Priority: ${rec.reorderPriority}`, 140, 42);

    // Table
    doc.autoTable({
      startY: 55,
      head: [['Product Name', 'Category', 'Quantity to Order']],
      body: [
        [rec.productName, rec.category || 'N/A', rec.recommendedOrderQuantity.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Notes
    doc.setFontSize(10);
    doc.text('Reason for Order:', 20, doc.lastAutoTable.finalY + 15);
    doc.text(rec.recommendationReason || 'Routine restock based on AI forecasting.', 20, doc.lastAutoTable.finalY + 22);

    doc.save(`PO_${rec.productName.replace(/\s+/g, '_')}.pdf`);
  };

  // ── Render Helpers ──
  const PriorityBadge = ({ priority }) => {
    const config = {
      Critical: 'bg-red-100 text-red-700 border-red-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`px-2 py-1 text-xs font-bold border rounded-md ${config[priority]}`}>
        {priority}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p style={{ color: payload[0].fill }}>
          {payload[0].name}: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain size={24} className="text-blue-600" />
            Automated Reorder Recommendations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-driven smart replenishment system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Analyzing…' : 'Generate Recommendations'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
            <Package size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Recommendations</p>
            <p className="text-2xl font-bold text-slate-800">{kpis.total}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Critical Reorders</p>
            <p className="text-2xl font-bold text-slate-800">{kpis.critical}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-50">
            <AlertCircle size={22} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">High Priority</p>
            <p className="text-2xl font-bold text-slate-800">{kpis.high}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-50">
            <ShieldCheck size={22} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Potential Stockouts</p>
            <p className="text-2xl font-bold text-slate-800">{kpis.stockout}</p>
          </div>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Priority Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Reorder Priority Distribution</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center animate-pulse"><div className="w-32 h-32 rounded-full bg-slate-200"></div></div>
          ) : priorityData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {priorityData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[d.name] }}></span>
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stock Risk Analysis */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Stock Risk (Days Remaining)</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center animate-pulse"><div className="w-full h-32 bg-slate-200 rounded"></div></div>
          ) : riskData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="days" fill="#ef4444" radius={[0, 4, 4, 0]} name="Days Remaining" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Health Score & AI Insights */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-sm p-5 flex flex-col text-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Zap size={15} className="text-yellow-400" />
              Inventory Health
            </h2>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: healthScore.color }}>{healthScore.score}</span>
              <span className="text-xs text-slate-400 ml-1">/100</span>
              <p className="text-xs font-medium" style={{ color: healthScore.color }}>{healthScore.status}</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-slate-400 text-sm animate-pulse">Generating insights...</div>
            ) : globalInsights.map((insight, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                {insight.includes('⚠️') 
                  ? <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  : <Lightbulb size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                }
                <p className="text-xs text-slate-300 leading-snug">{insight.replace('⚠️ ', '')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">AI Recommendation Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">Smart reorder suggestions based on AI demand forecasts</p>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading AI predictions...</div>
        ) : recommendations.length === 0 ? (
          <div className="p-10 text-center text-slate-500 flex flex-col items-center">
            <ShieldCheck size={40} className="text-emerald-400 mb-2 opacity-50" />
            <p>Inventory is perfectly balanced. No reorders needed right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium text-center">Stock</th>
                  <th className="p-4 font-medium text-center">Days Safe</th>
                  <th className="p-4 font-medium text-center">Forecast Demand</th>
                  <th className="p-4 font-medium text-center">Recommended Qty</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Confidence</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => (
                  <tr key={rec.product} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{rec.productName}</p>
                      <p className="text-xs text-slate-400">{rec.supplier || 'No Supplier'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${rec.currentStock === 0 ? 'text-red-600' : rec.currentStock <= rec.minimumThreshold ? 'text-amber-600' : 'text-slate-700'}`}>
                        {rec.currentStock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {rec.estimatedDaysRemaining === null ? '—' : (
                        <span className={`font-semibold ${rec.estimatedDaysRemaining <= 7 ? 'text-red-500' : 'text-slate-600'}`}>
                          {rec.estimatedDaysRemaining}d
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-indigo-600 font-semibold bg-indigo-50/30">
                      {rec.predictedMonthlyDemand} /mo
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                        {rec.recommendedOrderQuantity}
                      </span>
                    </td>
                    <td className="p-4">
                      <PriorityBadge priority={rec.reorderPriority} />
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600 font-medium">{rec.confidenceScore}%</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => generatePDF(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
                      >
                        <FileText size={13} />
                        Gen PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Recommendations;
