
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api';
import { getUpcomingMonday, getWeekLabel } from './utils';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const upcomingMonday = getUpcomingMonday();
  const weekLabel = getWeekLabel(upcomingMonday);

  const fetchData = useCallback(async () => {
    if (!state.currentUser) return;
    setIsSyncing(true);
    try {
      const teachers = await APIService.fetchTeachers();
      const plans = await APIService.fetchLessonPlans();
      const logs = await APIService.fetchLoginLogs();
      setState(prev => ({
        ...prev,
        teachers,
        lessonPlans: plans,
        loginLogs: logs
      }));
      setLastSynced(new Date());
    } catch (e) {
      console.error("Data Sync Error", e);
    } finally {
      setIsSyncing(false);
    }
  }, [state.currentUser]);

  useEffect(() => {
    // Initial Auth Check
    const savedUser = localStorage.getItem('shs_user');
    if (savedUser) {
      setState(prev => ({ ...prev, currentUser: JSON.parse(savedUser) }));
    }
    setIsAuthenticating(false);
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      fetchData();
    }
  }, [state.currentUser, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
      const user = 'admin' as const;
      setState(prev => ({ ...prev, currentUser: user }));
      localStorage.setItem('shs_user', JSON.stringify(user));
    } else {
      const teacher = state.teachers.find(t => t.email === loginEmail);
      const expectedPass = teacher?.password || DEFAULT_TEACHER_PASSWORD;
      if (teacher && loginPassword === expectedPass) {
        setState(prev => ({ ...prev, currentUser: teacher }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
      } else {
        alert("Invalid credentials. Please contact Administrator.");
      }
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    localStorage.removeItem('shs_user');
  };

  const handleProcessRequest = async (plan: LessonPlan, decision: 'approve' | 'decline') => {
    const actionText = decision === 'approve' ? 'APPROVE and DELETE this record for resubmission' : 'DECLINE';
    if (!confirm(`Are you sure you want to ${actionText}?`)) return;
    
    setIsSyncing(true);
    try {
      await APIService.handleResubmissionDecision(plan, decision);
      alert(`Request ${decision === 'approve' ? 'Approved' : 'Declined'} successfully.`);
      await fetchData();
    } catch (e) {
      alert("Error processing request.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Booting Infrastructure...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-100 mb-6">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Sacred Heart Hub</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Institutional Access Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input type="email" placeholder="Faculty Email" required className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input type="password" placeholder="Access Code" required className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all">Authorize Access</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingRequests = state.lessonPlans.filter(p => p.resubmissionStatus === 'pending');

  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={fetchData}
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}>
                <tab.icon className={`h-3.5 w-3.5 ${tab.id === 'requests' && pendingRequests.length > 0 ? 'text-rose-500 animate-pulse' : ''}`} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'requests' && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Pending Edit Requests</h3>
                <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{pendingRequests.length} Pending</span>
              </div>
              
              <div className="space-y-4">
                {pendingRequests.length > 0 ? pendingRequests.map(plan => (
                  <div key={plan.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 italic text-lg shadow-sm">{plan.className}</div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Request from {plan.teacherName}</p>
                        <h4 className="text-lg font-black text-slate-900 leading-tight italic">{plan.subject}: {plan.chapter}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Week: {plan.weekLabel}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => handleProcessRequest(plan, 'approve')} disabled={isSyncing} className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Approve & Reset</button>
                      <button onClick={() => handleProcessRequest(plan, 'decline')} disabled={isSyncing} className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"><X className="h-3.5 w-3.5" /> Decline</button>
                    </div>
                  </div>
                )) : (
                  <div className="p-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                    <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">All Clear: No Pending Requests</p>
                  </div>
                )}
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
          
          {activeTab === 'plans' && (
            <div className="p-20 border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
              <Zap className="h-12 w-12 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase italic italic tracking-tight mb-2">AI Syllabus Audit</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select a class to audit weekly compliance.</p>
            </div>
          )}
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          history={state.lessonPlans.filter(p => p.teacherId === (state.currentUser as Teacher).id)} 
        />
      )}
    </Layout>
  );
};

export default App;
