import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, AlertCircle, FileText } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Forecasting', path: '/forecasting', icon: <TrendingUp size={20} /> },
    { name: 'Forecast History', path: '/forecast-history', icon: <FileText size={20} /> },
    { name: 'Recommendations', path: '/recommendations', icon: <AlertCircle size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="w-64 bg-surface h-full shadow-lg border-r border-slate-700/50 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
          InventoryEye
        </h1>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-textMuted hover:bg-slate-700/30 hover:text-textMain'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
