import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Clock, ArrowLeft, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

const trendIcon = (dir) => {
  if (dir === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
  if (dir === 'down') return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-slate-400" />;
};

const confidenceColor = (v) => {
  if (v >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (v >= 65) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const ForecastHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/forecasts/history');
        setHistory(data);
      } catch (error) {
        console.error('Error fetching forecast history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <Link to="/forecasting" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Forecast History Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track historical predictions and model performance over time.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Target size={17} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">Historical Records</h2>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
            {history.length} records found
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading history data...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No forecast history available yet. Generate a forecast first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="p-4 font-medium">Date Generated</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium text-center">Predicted Weekly</th>
                  <th className="p-4 font-medium text-center">Predicted Monthly</th>
                  <th className="p-4 font-medium">Trend</th>
                  <th className="p-4 font-medium text-center">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-800">
                        {new Date(record.forecastDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(record.forecastDate).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{record.productName}</td>
                    <td className="p-4 text-center font-semibold text-slate-600">{record.weeklyPrediction}</td>
                    <td className="p-4 text-center font-semibold text-slate-600">{record.monthlyPrediction}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        {trendIcon(record.trend)}
                        <span className="capitalize">{record.trend}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-xs font-bold border rounded-md ${confidenceColor(record.confidenceScore)}`}>
                        {record.confidenceScore}%
                      </span>
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

export default ForecastHistory;
