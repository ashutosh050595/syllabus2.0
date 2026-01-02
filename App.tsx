
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail, GraduationCap
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api';
import { getUpcomingMonday } from './utils';
import { ADMIN_CREDENTIALS, DEFAULT_TEACHER_PASSWORD } from './constants';
import Layout from './components/Layout';
import AdminRegistry from './components/AdminRegistry';
import TeacherForm from './components/TeacherForm';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [] 
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history' | 'logins' | 'requests'>('plans');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const fetchData = useCallback(async (userOverride?: any) => {
    const user = userOverride || state.currentUser;
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const [teachers, plans, logs] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans(),
        APIService.fetchLoginLogs()
      ]);
      
      setState(prev => ({
        ...prev,
        teachers,
        lessonPlans: plans,
        loginLogs: logs
      }));
      setLastSynced(new Date());
    } catch (e) {
      console.error("Institutional Cloud Sync Failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [state.currentUser]);

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('shs_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setState(prev => ({ ...prev, currentUser: parsedUser }));
          fetchData(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('shs_user');
      } finally {
        setTimeout(() => setIsAuthenticating(false), 1000);
      }
    };
    init();
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    try {
      if (loginMode === 'admin') {
        if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
          const user = 'admin' as const;
          setState(prev => ({ ...prev, currentUser: user }));
          localStorage.setItem('shs_user', JSON.stringify(user));
          await fetchData(user);
          return;
        } else {
          alert("Admin Access Denied: Incorrect Credentials.");
          setIsSyncing(false);
          return;
        }
      }

      // Teacher Login Logic
      let currentTeachers = state.teachers;
      if (currentTeachers.length === 0) {
        currentTeachers = await APIService.fetchTeachers();
        setState(prev => ({ ...prev, teachers: currentTeachers }));
      }

      const teacher = currentTeachers.find(t => t.email.toLowerCase() === loginEmail.toLowerCase());
      const expectedPass = teacher?.password || DEFAULT_TEACHER_PASSWORD;

      if (teacher && loginPassword === expectedPass) {
        setState(prev => ({ ...prev, currentUser: teacher }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
        await fetchData(teacher);
      } else {
        alert("Faculty Access Denied: Please check your email and access code.");
      }
    } catch (err) {
      alert("Institutional Cloud unreachable. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null, teachers: [], lessonPlans: [], loginLogs: [] }));
    localStorage.removeItem('shs_user');
    setLastSynced(null);
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <RefreshCw className="h-14 w-14 text-indigo-600 animate-spin opacity-20" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-indigo-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Securing Infrastructure...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-indigo-600 rounded-[2.2rem] shadow-xl shadow-indigo-100 mb-6">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Institutional Hub</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-4">Sacred Heart School, Telaiya</p>
          </div>

          {/* Login Tabs */}
          <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-2xl flex gap-2 mb-6">
            <button 
              onClick={() => setLoginMode('teacher')}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${loginMode === 'teacher' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Faculty Portal
            </button>
            <button 
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Administrative Core
            </button>
          </div>

          {/* Login Form */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder={loginMode === 'admin' ? "Admin ID" : "Faculty Email"} 
                  required 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Access Code" 
                  required 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSyncing} 
                className={`w-full font-black py-5 rounded-2xl shadow-xl uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${loginMode === 'admin' ? 'bg-slate-900 hover:bg-black text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}
              >
                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : `Authorize ${loginMode === 'admin' ? 'Admin' : 'Faculty'}`}
              </button>
            </form>
            <p className="mt-8 text-[8px] font-black text-slate-300 text-center uppercase tracking-[0.5em]">Secure Institutional Protocol</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingRequests = state.lessonPlans.filter(p => p.resubmissionStatus === 'pending');

  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={() => fetchData()}
      isSyncing={isSyncing}
      lastSynced={lastSynced}
    >
      {state.currentUser === 'admin' ? (
        <div className="space-y-10">
          <div className="flex justify-center flex-wrap gap-2">
            {[
              { id: 'plans', label: 'AI Audit', icon: Zap },
              { id: 'requests', label: `Requests ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}`, icon: AlertCircle },
              { id: 'registry', label: 'Registry', icon: Users },
              { id: 'compile', label: 'Compiler', icon: Printer },
              { id: 'history', label: 'Archive', icon: History },
              { id: 'logins', label: 'Access Logs', icon: Key }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600 hover:border-indigo-100'}`}>
                <tab.icon className={`h-3.5 w-3.5 ${tab.id === 'requests' && pendingRequests.length > 0 ? 'text-rose-500 animate-pulse' : ''}`} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'requests' && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Pending Resubmissions</h3>
                <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingRequests.length} Pending</span>
              </div>
              <div className="space-y-4">
                {pendingRequests.map(plan => (
                  <div key={plan.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 italic text-lg shadow-sm">{plan.className}</div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Teacher: {plan.teacherName}</p>
                        <h4 className="text-lg font-black text-slate-900 leading-tight italic">{plan.subject}: {plan.chapter}</h4>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => APIService.handleResubmissionDecision(plan, 'approve').then(() => fetchData())} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Approve</button>
                      <button onClick={() => APIService.handleResubmissionDecision(plan, 'decline').then(() => fetchData())} className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><X className="h-3.5 w-3.5" /> Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'registry' && (
            <AdminRegistry 
              teachers={state.teachers}
              lessonPlans={state.lessonPlans}
              onAddTeacher={async (t) => { await APIService.addTeacher(t); await fetchData(); }}
              onUpdateTeacher={async (id, upd) => { await APIService.updateTeacher(id, upd); await fetchData(); }}
              onRemoveTeacher={async (id) => { await APIService.removeTeacher(id); await fetchData(); }}
            />
          )}

          {['plans', 'compile', 'history', 'logins'].includes(activeTab) && (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-sm text-center">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Secure Module Active</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select a valid operation from the dashboard navigation.</p>
            </div>
          )}
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          history={state.lessonPlans.filter(p => p.teacherId === (state.currentUser as Teacher).id || p.teacherName === (state.currentUser as Teacher).name)} 
        />
      )}
    </Layout>
  );
};

export default App;
