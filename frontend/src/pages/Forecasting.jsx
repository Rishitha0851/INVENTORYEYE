import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  Brain, BarChart2, Lightbulb, Package, RefreshCw,
  ChevronDown, ChevronUp, Activity, Target, Zap, Clock, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const trendIcon = (dir) => {
  if (dir === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
  if (dir === 'down') return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-slate-400" />;
};

const trendColor = (dir) =>
  dir === 'up' ? 'text-emerald-600' : dir === 'down' ? 'text-red-500' : 'text-slate-500';

const confidenceColor = (v) => {
  if (v >= 80) return 'bg-emerald-500';
  if (v >= 65) return 'bg-amber-400';
  return 'bg-red-400';
};

const confidenceBadge = (v) => {
  if (v >= 80) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (v >= 65) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
};

const stockoutBadge = (days) => {
  if (days === null) return null;
  if (days === 0) return { label: 'Needs Restock', cls: 'bg-red-100 text-red-700 border border-red-300' };
  if (days <= 7) return { label: `${days}d to stockout`, cls: 'bg-red-50 text-red-600 border border-red-200' };
  if (days <= 14) return { label: `${days}d to stockout`, cls: 'bg-amber-50 text-amber-600 border border-amber-200' };
  return { label: `${days}d safe`, cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon size={22} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ConfidenceBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${confidenceColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceBadge(value)}`}>
      {value}%
    </span>
  </div>
);

const GaugeChart = ({ value }) => {
  const data = [
    { name: 'Score', value: value, fill: value >= 80 ? '#10b981' : value >= 65 ? '#fbbf24' : '#ef4444' },
    { name: 'Empty', value: 100 - value, fill: '#f1f5f9' },
  ];
  return (
    <div className="relative w-full h-32 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 text-center">
        <p className="text-2xl font-bold text-slate-800">{value}%</p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Forecasting = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('30'); // 7, 30, 90 days

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/forecasts');
      setForecasts(data);
    } catch (error) {
      console.error('Error fetching forecasts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/forecasts/generate');
      await fetchForecasts();
    } catch (error) {
      console.error('Error generating forecasts', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { fetchForecasts(); }, []);

  // ── Derived data ─────────────────────────────────────────────────────────
  const categories = useMemo(() => [...new Set(forecasts.map((f) => f.category).filter(Boolean))], [forecasts]);

  const filtered = useMemo(() => {
    let result = [...forecasts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) =>
        f.productName.toLowerCase().includes(q) || f.sku.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) result = result.filter((f) => f.category === categoryFilter);
    return result;
  }, [forecasts, searchQuery, categoryFilter]);

  const kpis = useMemo(() => {
    const totalWeekly = forecasts.reduce((s, f) => s + f.avgWeeklyDemand, 0);
    const totalMonthly = forecasts.reduce((s, f) => s + f.avgMonthlyDemand, 0);
    const avgConfidence = forecasts.length ? Math.round(forecasts.reduce((s, f) => s + f.overallConfidence, 0) / forecasts.length) : 0;
    const atRisk = forecasts.filter(f => f.daysUntilStockout !== null && f.daysUntilStockout <= 7).length;

    return { totalWeekly, totalMonthly, avgConfidence, atRisk };
  }, [forecasts]);

  const globalInsights = useMemo(() => {
    const all = [];
    forecasts.forEach((f) => f.insights?.forEach((ins) => all.push({ text: ins, product: f.productName })));
    return all.sort((a) => (a.text.startsWith('⚠️') ? -1 : 1)).slice(0, 8);
  }, [forecasts]);

  const salesTrendData = useMemo(() => {
    if (!forecasts.length) return [];
    // Creating a mock "Forecast vs Actual" trend based on the available data
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map((week, i) => ({
      week,
      forecast: forecasts.reduce((sum, f) => sum + (f.weeklyForecasts?.[i]?.expectedDemand ?? 0), 0),
      actual: i === 0 ? forecasts.reduce((sum, f) => sum + (f.avgWeeklyDemand ?? 0), 0) : null // Mocking actual only for week 1
    }));
  }, [forecasts]);

  const exportCSV = () => {
    const headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Weekly Forecast', 'Monthly Forecast', 'Confidence', 'Trend'];
    const rows = filtered.map(f => [
      `"${f.productName}"`,
      f.sku,
      `"${f.category}"`,
      f.currentStock,
      f.avgWeeklyDemand,
      f.avgMonthlyDemand,
      `${f.overallConfidence}%`,
      f.trendDirection
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain size={24} className="text-blue-600" />
            AI Demand Forecasting Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Machine-learning powered demand predictions based on historical sales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/forecast-history"
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Clock size={15} />
            Forecast History
          </Link>
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
            {generating ? 'Processing Data…' : 'Generate Forecasts'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Total Weekly Demand" value={kpis.totalWeekly} sub="Expected units next 7 days" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <KpiCard icon={BarChart2} label="Total Monthly Demand" value={kpis.totalMonthly} sub="Expected units next 30 days" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <KpiCard icon={Activity} label="Avg Confidence" value={`${kpis.avgConfidence}%`} sub="Overall model accuracy" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KpiCard icon={AlertTriangle} label="Products At Risk" value={kpis.atRisk} sub="Near stockout in 7 days" iconBg="bg-red-50" iconColor="text-red-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Forecast vs Actual Demand Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Target size={17} className="text-indigo-500" />
                Forecast vs Actual Demand
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Aggregate future demand vs current actuals</p>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="7">Next 7 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="90">Next 90 Days</option>
            </select>
          </div>
          {loading ? (
            <div className="flex-1 min-h-[200px] flex items-center justify-center text-slate-400 text-sm animate-pulse">
              Generating chart…
            </div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" name="Forecasted Demand" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" name="Actual Demand" dot={{ r: 4 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Confidence Gauge & Insights */}
        <div className="space-y-6 flex flex-col">
          {/* Gauge */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center flex-1">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Model Confidence Score</h2>
            <p className="text-xs text-slate-500 mb-4">Overall accuracy based on historical variance</p>
            {loading ? (
              <div className="h-32 flex justify-center items-center"><div className="animate-pulse bg-slate-200 h-24 w-48 rounded-t-full"></div></div>
            ) : (
              <GaugeChart value={kpis.avgConfidence} />
            )}
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl shadow-sm p-5 text-white flex-1 flex flex-col">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Zap size={17} className="text-yellow-300" />
              Advanced AI Insights
            </h2>
            <p className="text-xs text-blue-200 mb-4 pb-3 border-b border-white/10">Real-time alerts and recommendations</p>
            {loading ? (
              <div className="text-blue-200 text-sm animate-pulse">Analyzing inventory patterns…</div>
            ) : globalInsights.length === 0 ? (
              <p className="text-blue-200 text-sm">Add products and generate forecasts to see insights.</p>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                {globalInsights.map((item, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2.5 rounded-lg leading-snug flex gap-2 items-start
                      ${item.text.startsWith('⚠️')
                        ? 'bg-red-500/20 border border-red-400/30'
                        : 'bg-white/10 border border-white/10'
                      }`}
                  >
                    {item.text.startsWith('⚠️')
                      ? <AlertTriangle size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
                      : <Lightbulb size={14} className="text-yellow-300 flex-shrink-0 mt-0.5" />
                    }
                    <span>
                      <span className="font-semibold text-white/90">{item.product}: </span>
                      <span className="text-blue-100">{item.text.replace('⚠️ ', '')}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Product Forecast Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Package size={17} className="text-blue-500" />
              Product Demand Prediction
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive view of all forecasts and confidence scores</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading table data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium text-center">Current Stock</th>
                  <th className="p-4 font-medium text-center">Weekly Forecast</th>
                  <th className="p-4 font-medium text-center">Monthly Forecast</th>
                  <th className="p-4 font-medium">Trend</th>
                  <th className="p-4 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.sku} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{f.productName}</p>
                      <p className="text-xs text-slate-400 font-mono">{f.sku} · {f.category}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold px-2.5 py-1 rounded-md ${
                        f.currentStock === 0 ? 'bg-red-50 text-red-600' : 
                        f.currentStock <= f.reorderPoint ? 'bg-amber-50 text-amber-600' : 
                        'text-slate-700 bg-slate-50'
                      }`}>
                        {f.currentStock}
                      </span>
                    </td>
                    <td className="p-4 text-center text-blue-600 font-bold bg-blue-50/20">{f.avgWeeklyDemand}</td>
                    <td className="p-4 text-center text-indigo-600 font-bold bg-indigo-50/20">{f.avgMonthlyDemand}</td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1.5 font-medium ${trendColor(f.trendDirection)}`}>
                        {trendIcon(f.trendDirection)}
                        {f.trendDirection === 'stable' ? 'Stable' : `${f.trendPercent}%`}
                      </div>
                    </td>
                    <td className="p-4 w-40">
                      <ConfidenceBar value={f.overallConfidence} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecasting;
