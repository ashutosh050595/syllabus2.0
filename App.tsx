import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail, GraduationCap, FileText, User
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api';
import { INITIAL_TEACHERS } from './constants';
import Layout from './components/Layout';
import AdminRegistry from './components/AdminRegistry';
import AdminCompiler from './components/AdminCompiler';
import TeacherForm from './components/TeacherForm';
import SubmissionHistory from './components/SubmissionHistory';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [] 
  });
  const [activeTab, setActiveTab] = useState<'registry' | 'submissions' | 'compile' | 'logins'>('registry');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const initialFetchDone = useRef(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const fetchData = useCallback(async (userOverride?: any) => {
    const user = userOverride || state.currentUser;
    if (!user) {
      setIsAuthenticating(false);
      return;
    }
    
    setIsSyncing(true);
    try {
      const [teachers, lessonPlans, loginLogs] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans(),
        user === 'admin' ? APIService.fetchLoginLogs() : Promise.resolve([])
      ]);
      
      // AUTO-SEED: If admin/user logs in and database is empty, seed it once
      if (teachers.length === 0 && !initialFetchDone.current) {
        console.log("Empty cloud registry detected. Seeding...");
        await APIService.syncInitialTeachers(INITIAL_TEACHERS);
        const refreshedTeachers = await APIService.fetchTeachers();
        setState(prev => ({ ...prev, teachers: refreshedTeachers, lessonPlans, loginLogs }));
      } else {
        setState(prev => ({ ...prev, teachers, lessonPlans, loginLogs }));
      }
      
      setLastSynced(new Date());
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      setIsSyncing(false);
      setIsAuthenticating(false);
      initialFetchDone.current = true;
    }
  }, [state.currentUser]);

  useEffect(() => {
    // HARD TIMEOUT: Stop the spinner no matter what after 3.5 seconds
    const safetyTimeout = setTimeout(() => {
      setIsAuthenticating(false);
    }, 3500);

    const init = async () => {
      try {
        const savedUser = localStorage.getItem('shs_user');
        if (savedUser && savedUser !== "undefined") {
          const parsedUser = JSON.parse(savedUser);
          setState(prev => ({ ...prev, currentUser: parsedUser }));
          await fetchData(parsedUser);
        } else {
          setIsAuthenticating(false);
        }
      } catch (e) {
        setIsAuthenticating(false);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };
    init();
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      if (loginMode === 'admin') {
        const { ADMIN_CREDENTIALS } = await import('./constants');
        if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
          const user = 'admin' as const;
          setState(prev => ({ ...prev, currentUser: user }));
          localStorage.setItem('shs_user', JSON.stringify(user));
          await fetchData(user);
          return;
        } else {
          alert("Admin Access Denied.");
          return;
        }
      }

      let teachers = state.teachers;
      if (teachers.length === 0) teachers = await APIService.fetchTeachers();

      const teacher = teachers.find(t => t.email.toLowerCase().trim() === loginEmail.toLowerCase().trim());
      const { DEFAULT_TEACHER_PASSWORD } = await import('./constants');
      const expectedPass = teacher?.password || DEFAULT_TEACHER_PASSWORD;

      if (teacher && loginPassword === expectedPass) {
        setState(prev => ({ ...prev, currentUser: teacher, teachers }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
        await fetchData(teacher);
      } else {
        alert("Invalid credentials.");
      }
    } catch (err) {
      alert("Network failed. Please check internet connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setState({ currentUser: null, teachers: [], lessonPlans: [], loginLogs: [] });
    localStorage.removeItem('shs_user');
    setLastSynced(null);
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
             <GraduationCap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional Protocol Active</p>
          </div>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-100 border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
             
             <div className="flex flex-col items-center mb-10 text-center">
               <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 mb-6">
                 <ShieldCheck className="h-8 w-8 text-white" />
               </div>
               <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Sacred Heart</h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Management Hub</p>
             </div>

             <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
               <button 
                 onClick={() => setLoginMode('teacher')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Teacher
               </button>
               <button 
                 onClick={() => setLoginMode('admin')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Administrator
               </button>
             </div>

             <form onSubmit={handleLogin} className="space-y-4">
               <div className="relative">
                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                 <input 
                   required
                   type="email"
                   placeholder="Official Email"
                   className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
                   value={loginEmail}
                   onChange={e => setLoginEmail(e.target.value)}
                 />
               </div>

               <div className="relative">
                 <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                 <input 
                   required
                   type="password"
                   placeholder="Access Pin"
                   className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm tracking-widest"
                   value={loginPassword}
                   onChange={e => setLoginPassword(e.target.value)}
                 />
               </div>

               <button 
                 disabled={isSyncing}
                 className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Authorize Entry"}
               </button>
             </form>
             
             <div className="mt-8 text-center">
               <p className="text-[9px] text-slate-400 font-bold">
                 {loginMode === 'teacher' 
                   ? "Use your registered email and default password" 
                   : "Admin access requires special credentials"}
               </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={() => fetchData()}
      isSyncing={isSyncing}
      lastSynced={lastSynced}
    >
      {state.currentUser === 'admin' ? (
        <div className="space-y-8">
          <div className="flex justify-center flex-wrap gap-2 print-hidden">
            {[
              { id: 'registry', label: 'Faculty Registry', icon: Users },
              { id: 'submissions', label: 'Submissions', icon: FileText },
              { id: 'compile', label: 'Pdf Compilation', icon: Printer },
              { id: 'logins', label: 'Access Logs', icon: Key }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}
              >
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'registry' && (
              <AdminRegistry 
                teachers={state.teachers}
                lessonPlans={state.lessonPlans}
                onAddTeacher={async (t) => { await APIService.addTeacher(t); await fetchData(); }}
                onUpdateTeacher={async (id, upd) => { await APIService.updateTeacher(id, upd); await fetchData(); }}
                onRemoveTeacher={async (id) => { await APIService.removeTeacher(id); await fetchData(); }}
              />
            )}
            
            {activeTab === 'submissions' && (
              <SubmissionHistory 
                lessonPlans={state.lessonPlans} 
                teachers={state.teachers} 
              />
            )}
            
            {activeTab === 'compile' && (
              <AdminCompiler 
                lessonPlans={state.lessonPlans} 
                teachers={state.teachers} 
              />
            )}
            
            {activeTab === 'logins' && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight">Recent Access Logs</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                      Last 50 login activities
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-slate-400">
                    Total: {state.loginLogs.length}
                  </div>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {state.loginLogs.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                      <Key className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">No login records found</p>
                    </div>
                  ) : (
                    state.loginLogs.slice(0, 50).map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-lg">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-[11px] font-black uppercase text-slate-800">{log.name}</div>
                            <div className="text-[9px] font-bold text-slate-500">{log.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[8px] text-slate-300 font-bold">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          history={state.lessonPlans.filter(p => p.teacherId === (state.currentUser as Teacher).email)} 
        />
      )}
    </Layout>
  );
};

export default App;
