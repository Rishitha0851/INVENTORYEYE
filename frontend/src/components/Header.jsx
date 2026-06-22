import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="h-16 bg-surface shadow-sm border-b border-slate-700/50 flex items-center justify-between px-6">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-textMain">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <User size={18} />
          </div>
          <span className="font-medium">{user?.name || 'Admin User'}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
