
import React, { useState, useEffect } from 'react';
import { Teacher, AppState } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import { ADMIN_CREDENTIALS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap } from 'lucide-react';

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
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

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
          // Fix: Proper state spreading to avoid overwriting existing teachers/lessonPlans data
          setState(prev => ({ ...prev, currentUser: 'admin' }));
        } else {
          // Find teacher by email
          const teachers = await APIService.fetchTeachers();
          const teacher = teachers.find(t => t.email === user.email);
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
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) alert(res.message);
  };

  const handleLogout = async () => {
    await APIService.logout();
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // Logic to execute Gemini AI Curriculum Audit
  const handleRunAudit = async () => {
    if (state.lessonPlans.length === 0) return;
    setIsAuditing(true);
    try {
      const result = await APIService.generateAIAudit(state.lessonPlans);
      setAuditResult(result);
    } catch (e) {
      console.error(e);
      alert("AI Audit failed to initialize. Please check network connectivity.");
    } finally {
      setIsAuditing(false);
    }
  };

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-3xl mb-6 shadow-xl shadow-indigo-500/20">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter">SACRED HEART</h2>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-2">Academic Portal Authentication</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="email" 
                placeholder="Institutional Email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Secure Password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-xs">
              Establish Session
            </button>
          </form>
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
            <div className="bg-white/5 p-2 rounded-[2rem] border border-white/10 flex gap-2">
              <button 
                onClick={() => setActiveTab('plans')}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <ClipboardList className="h-4 w-4" /> Curriculum Audit
              </button>
              <button 
                onClick={() => setActiveTab('registry')}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
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
                  alert("Failed to remove teacher from Cloud.");
                } finally {
                  setIsSyncing(false);
                }
              }} 
            />
          )}
          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/10 gap-6 backdrop-blur-xl">
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight flex items-center gap-3">
                    <Zap className="h-6 w-6 text-indigo-400 animate-pulse" /> Academic Audit Engine
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2 opacity-80">Generative AI Curriculum Analysis</p>
                </div>
                <button 
                  onClick={handleRunAudit}
                  disabled={isAuditing || state.lessonPlans.length === 0}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-3 border border-emerald-500/20"
                >
                  {isAuditing ? 'Synthesizing...' : 'Execute AI Audit'}
                </button>
              </div>

              {auditResult ? (
                <div className="glass-card p-10 rounded-[3rem] border border-white/10 text-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/5 backdrop-blur-2xl">
                  <div className="flex items-center gap-4 mb-8 text-emerald-400 border-b border-white/5 pb-6">
                    <ShieldCheck className="h-8 w-8" />
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Cloud Intelligence Report</h4>
                  </div>
                  <div className="whitespace-pre-wrap font-bold leading-relaxed text-sm bg-black/20 p-8 rounded-2xl border border-white/5 shadow-inner">
                    {auditResult}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-24 rounded-[4rem] text-center border-2 border-dashed border-indigo-500/20 flex flex-col items-center justify-center">
                  <ClipboardList className="h-12 w-12 text-indigo-500/30 mb-6" />
                  <div className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs italic opacity-40">
                    {state.lessonPlans.length === 0 ? 'Data Pool Empty: No Records Found' : 'Awaiting Engine Initialization'}
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
            alert("Lesson plans submitted successfully!");
            setIsSyncing(false);
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
