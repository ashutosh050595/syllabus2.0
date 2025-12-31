
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
  const timeAgo = lastSynced ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 transition-all px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto glass-card rounded-[2.5rem] px-8 py-4 shadow-2xl border border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center space-x-5">
            <div className="bg-indigo-600 p-3 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 transform hover:scale-110 transition-transform cursor-pointer">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-white leading-none tracking-tighter uppercase italic">Sacred Heart</h1>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-1.5 opacity-80">Academic Cloud Hub</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 sm:space-x-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={onRefresh}
                disabled={isSyncing}
                className={`p-3 rounded-2xl border border-white/10 bg-white/5 transition-all active:scale-95 group ${isSyncing ? 'opacity-50' : 'hover:bg-white/10'}`}
              >
                <RefreshCw className={`h-5 w-5 text-emerald-400 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
              </button>

              <div className="flex flex-col items-end">
                <span className="text-sm sm:text-lg font-black text-white italic tracking-tight">
                  {user === 'admin' ? 'Admin Core' : user.name}
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  <span className="text-[8px] sm:text-[9px] text-indigo-400 font-black uppercase tracking-[0.1em]">
                    Sync: {timeAgo}
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex h-12 w-12 bg-white/5 rounded-2xl items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
                {user === 'admin' ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="p-4 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-95 group border border-transparent hover:border-rose-500/20"
              title="End Session"
            >
              <LogOut className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-0 w-[30rem] h-[30rem] bg-rose-600/5 rounded-full blur-[120px] -z-10 animate-pulse transition-all duration-[8000ms]"></div>
        {children}
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-40">
          &copy; {new Date().getFullYear()} Sacred Heart Koderma • Real-Time Cloud Infrastructure
        </p>
      </footer>
    </div>
  );
};

export default Layout;
