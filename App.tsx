
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
import AdminCompiler from './components/AdminCompiler';
import TeacherForm from './components/TeacherForm';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [] 
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history' | 'logins' | 'requests'>('registry');
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
      console.error("Sync Failure:", e);
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
        setTimeout(() => setIsAuthenticating(false), 800);
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
          alert("Admin Access Denied.");
          setIsSyncing(false);
          return;
        }
      }

      let currentTeachers = state.teachers;
      if (currentTeachers.length === 0) {
        currentTeachers = await APIService.fetchTeachers();
      }

      const teacher = currentTeachers.find(t => t.email.toLowerCase() === loginEmail.toLowerCase());
      const expectedPass = teacher?.password || DEFAULT_TEACHER_PASSWORD;

      if (teacher && loginPassword === expectedPass) {
        setState(prev => ({ ...prev, currentUser: teacher }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
        await fetchData(teacher);
      } else {
        alert("Teacher Login Failed: Check credentials.");
      }
    } catch (err) {
      alert("Connection error.");
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
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional Protocol Active</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 mb-6 text-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Institutional Hub</h2>
          </div>

          <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl flex gap-1 mb-6">
            <button onClick={() => setLoginMode('teacher')} className={`flex-1 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${loginMode === 'teacher' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Teacher Login</button>
            <button onClick={() => setLoginMode('admin')} className={`flex-1 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Admin Login</button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" placeholder="Email Address" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input type="password" placeholder="Access Code" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <button type="submit" disabled={isSyncing} className={`w-full font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all ${loginMode === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : 'Authorize Access'}
              </button>
            </form>
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
        <div className="space-y-8">
          <div className="flex justify-center flex-wrap gap-2 print-hidden">
            {[
              { id: 'registry', label: 'Faculty Registry', icon: Users },
              { id: 'compile', label: 'Compiler', icon: Printer },
              { id: 'requests', label: `Edit Requests ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}`, icon: AlertCircle },
              { id: 'plans', label: 'AI Audit', icon: Zap },
              { id: 'history', label: 'Archive', icon: History },
              { id: 'logins', label: 'Access Logs', icon: Key }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}>
                <tab.icon className={`h-3.5 w-3.5 ${tab.id === 'requests' && pendingRequests.length > 0 ? 'text-rose-500 animate-pulse' : ''}`} /> {tab.label}
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

            {activeTab === 'compile' && (
              <AdminCompiler 
                lessonPlans={state.lessonPlans}
                teachers={state.teachers}
              />
            )}

            {activeTab === 'requests' && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Pending Resubmissions</h3>
                  <span className="bg-rose-50 text-rose-600 px-4 py-1 rounded-full text-[10px] font-black">{pendingRequests.length} Pending</span>
                </div>
                <div className="space-y-4">
                  {pendingRequests.length > 0 ? pendingRequests.map(plan => (
                    <div key={plan.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Teacher: {plan.teacherName}</p>
                        <h4 className="text-lg font-black text-slate-900 italic">{plan.subject}: {plan.chapter}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{plan.weekLabel}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => APIService.handleResubmissionDecision(plan, 'approve').then(() => fetchData())} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md">Approve</button>
                        <button onClick={() => APIService.handleResubmissionDecision(plan, 'decline').then(() => fetchData())} className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest">Decline</button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                      <CheckCircle2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No pending requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {['plans', 'history', 'logins'].includes(activeTab) && (
              <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Module Ready: {activeTab.toUpperCase()}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] max-w-sm mx-auto">This institutional dashboard section is indexing your real-time cloud data.</p>
              </div>
            )}
          </div>
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
