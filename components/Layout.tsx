
import React from 'react';
import { LogOut, GraduationCap, User, ShieldCheck, RefreshCw, Clock } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSynced: Date | null;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onRefresh, isSyncing, lastSynced }) => {
  const timeAgo = lastSynced ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl px-8 py-4 shadow-sm flex justify-between items-center">
          <div className="flex items-center space-x-5">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-200 shadow-lg">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">Sacred Heart</h1>
              <p className="text-[8px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-1.5 opacity-80">Teacher Excellence Hub</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={onRefresh}
                disabled={isSyncing}
                className={`p-3 rounded-xl border border-slate-200 bg-slate-50 transition-all active:scale-95 group ${isSyncing ? 'opacity-50' : 'hover:bg-indigo-50 hover:border-indigo-100'}`}
              >
                <RefreshCw className={`h-4 w-4 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-900 italic tracking-tight">
                  {user === 'admin' ? 'Admin Core' : user.name}
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                    SYNCED {timeAgo}
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex h-10 w-10 bg-slate-50 rounded-xl items-center justify-center text-slate-400 border border-slate-200">
                {user === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">
          Sacred Heart Koderma • Institutional Management Platform • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Layout;
