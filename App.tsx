
import React, { useState, useEffect } from 'react';
import { Teacher, AppState } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import { ADMIN_CREDENTIALS, DEFAULT_TEACHER_PASSWORD } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Key, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    teachers: [],
    lessonPlans: []
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry'>('plans');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'teacher' as 'teacher' | 'admin' });

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [teachers, lessonPlans] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans()
      ]);
      setState(prev => ({ ...prev, teachers, lessonPlans }));
      setLastSynced(new Date());
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = APIService.onAuthChange(async (user) => {
      if (user) {
        if (user.email === ADMIN_CREDENTIALS.id) {
          setState(prev => ({ ...prev, currentUser: 'admin' }));
        } else {
          const teachers = await APIService.fetchTeachers();
          const teacher = teachers.find(t => t.email.toLowerCase() === user.email?.toLowerCase());
          setState(prev => ({ ...prev, teachers, currentUser: teacher || null }));
        }
        fetchData();
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;
    
    setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    setIsSyncing(false);

    if (!res.success) {
      alert(`Access Denied: ${res.message}`);
    }
  };

  const handleLogout = async () => {
    await APIService.logout();
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const handleRunAudit = async () => {
    if (state.lessonPlans.length === 0) return;
    setIsAuditing(true);
    try {
      const result = await APIService.generateAIAudit(state.lessonPlans);
      setAuditResult(result);
    } catch (e) {
      console.error(e);
      alert("AI Audit failed. Check your API key or connection.");
    } finally {
      setIsAuditing(false);
    }
  };

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-6">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Sacred Heart</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Authentication Portal</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
            <button 
              onClick={() => setLoginForm({...loginForm, type: 'teacher'})}
              className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User className="h-4 w-4" /> Faculty
            </button>
            <button 
              onClick={() => setLoginForm({...loginForm, type: 'admin'})}
              className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
              <input 
                type="email" 
                required
                placeholder={loginForm.type === 'teacher' ? "teacher@sacredheart.org" : "admin@sacredheartkoderma.org"}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-indigo-600 outline-none transition-all font-bold"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Access Key</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-indigo-600 outline-none transition-all font-bold"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button 
              disabled={isSyncing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {isSyncing ? 'Authenticating...' : `Enter as ${loginForm.type === 'teacher' ? 'Faculty' : 'Admin'}`}
            </button>
          </form>

          {loginForm.type === 'teacher' && (
            <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
              <p className="text-[10px] text-indigo-800 font-bold leading-relaxed">
                First-time users: Use your registered institutional email and the default password <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900">{DEFAULT_TEACHER_PASSWORD}</span> to activate your account.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
              <button 
                onClick={() => setActiveTab('plans')}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ClipboardList className="h-4 w-4" /> Curriculum Audit
              </button>
              <button 
                onClick={() => setActiveTab('registry')}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Users className="h-4 w-4" /> Faculty Registry
              </button>
            </div>
          </div>

          {activeTab === 'registry' && (
            <AdminRegistry 
              teachers={state.teachers} 
              onAddTeacher={async (t) => {
                setIsSyncing(true);
                await APIService.syncTeacher(t);
                setState(prev => ({...prev, teachers: [...prev.teachers, t]}));
                setIsSyncing(false);
              }} 
              onUpdateTeacher={async (id, upd) => {
                const updated = state.teachers.find(t => t.id === id);
                if (updated) {
                  const newTeacher = {...updated, ...upd} as Teacher;
                  setIsSyncing(true);
                  await APIService.syncTeacher(newTeacher);
                  setState(prev => ({...prev, teachers: prev.teachers.map(t => t.id === id ? newTeacher : t)}));
                  setIsSyncing(false);
                }
              }} 
              onRemoveTeacher={async (id) => {
                setIsSyncing(true);
                try {
                  await APIService.deleteTeacher(id);
                  setState(prev => ({...prev, teachers: prev.teachers.filter(t => t.id !== id)}));
                } catch (e) {
                  alert("Sync failed.");
                } finally {
                  setIsSyncing(false);
                }
              }} 
            />
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight flex items-center gap-3">
                    <Zap className="h-6 w-6 text-indigo-600" /> Academic Audit Engine
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Powered by Generative AI Intelligence</p>
                </div>
                <button 
                  onClick={handleRunAudit}
                  disabled={isAuditing || state.lessonPlans.length === 0}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg"
                >
                  {isAuditing ? 'Processing Data...' : 'Generate AI Report'}
                </button>
              </div>

              {auditResult ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4 mb-8 text-emerald-600 border-b border-slate-100 pb-6">
                    <ShieldCheck className="h-8 w-8" />
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Professional Audit Report</h4>
                  </div>
                  <div className="whitespace-pre-wrap font-bold leading-relaxed text-sm text-slate-700 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    {auditResult}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-24 rounded-3xl text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <ClipboardList className="h-12 w-12 text-slate-200 mb-6" />
                  <div className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
                    {state.lessonPlans.length === 0 ? 'No Data Collected' : 'Awaiting Audit Execution'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          onSubmit={async (plans) => {
            setIsSyncing(true);
            const lessonPlans = plans.map((p: any) => ({
              ...p,
              id: Math.random().toString(36).substr(2, 9),
              teacherId: (state.currentUser as Teacher).id,
              teacherName: (state.currentUser as Teacher).name
            }));
            await APIService.saveLessonPlans(lessonPlans);
            alert("Report submitted to administration.");
            setIsSyncing(false);
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
