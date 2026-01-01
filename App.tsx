
import React, { useState, useEffect } from 'react';
import { Teacher, AppState, ClassName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Loader2, FileText, Printer } from 'lucide-react';
import { getUpcomingMonday } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    teachers: [],
    lessonPlans: []
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile'>('plans');
  const [selectedClass, setSelectedClass] = useState<ClassName>('VII');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'teacher' as 'teacher' | 'admin' });

  const fetchData = async () => {
    try {
      setIsSyncing(true);
      const [teachers, lessonPlans] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans()
      ]);
      setState(prev => ({ ...prev, teachers, lessonPlans }));
      setLastSynced(new Date());
      setIsSyncing(false);
      return { teachers, lessonPlans };
    } catch (error) {
      console.error("Fetch error:", error);
      setIsSyncing(false);
      return { teachers: [], lessonPlans: [] };
    }
  };

  useEffect(() => {
    const unsubscribe = APIService.onAuthChange(async (user) => {
      setIsAuthenticating(true);
      try {
        if (user) {
          if (user.email?.toLowerCase().trim() === ADMIN_CREDENTIALS.id.toLowerCase().trim()) {
            setState(prev => ({ ...prev, currentUser: 'admin' }));
            await fetchData();
          } else {
            const { teachers } = await fetchData();
            const normalizedEmail = user.email?.toLowerCase().trim();
            const teacher = teachers.find(t => t.email.toLowerCase().trim() === normalizedEmail);
            
            if (teacher) {
              setState(prev => ({ ...prev, currentUser: teacher }));
            } else {
              // Final fallback check if teacher was just added
              const freshTeachers = await APIService.fetchTeachers();
              const freshTeacher = freshTeachers.find(t => t.email.toLowerCase().trim() === normalizedEmail);
              if (freshTeacher) {
                setState(prev => ({ ...prev, currentUser: freshTeacher, teachers: freshTeachers }));
              } else {
                alert(`System Error: Your account exists but your Teacher Profile was not found in the School Registry. Please contact the Administrator to verify your email: ${user.email}`);
                await APIService.logout();
                setState(prev => ({ ...prev, currentUser: null }));
              }
            }
          }
        } else {
          setState(prev => ({ ...prev, currentUser: null }));
        }
      } catch (err) {
        console.error("Auth change error:", err);
      } finally {
        setIsAuthenticating(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) {
      setIsSyncing(false);
      alert(`Access Denied: ${res.message}`);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticating(true);
    await APIService.logout();
    setState(prev => ({ ...prev, currentUser: null }));
    setIsAuthenticating(false);
  };

  if (isAuthenticating && !state.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Validating Credentials...</p>
      </div>
    );
  }

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
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><User className="h-4 w-4" /> Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><ShieldCheck className="h-4 w-4" /> Admin</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required placeholder="Email Address" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs">{isSyncing ? 'Verifying...' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout user={state.currentUser} onLogout={handleLogout} onRefresh={fetchData} isSyncing={isSyncing} lastSynced={lastSynced}>
      {state.currentUser === 'admin' ? (
        <div className="space-y-10">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
              <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><ClipboardList className="h-4 w-4" /> AI Audit</button>
              <button onClick={() => setActiveTab('registry')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Users className="h-4 w-4" /> Faculty Registry</button>
              <button onClick={() => setActiveTab('compile')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'compile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><FileText className="h-4 w-4" /> Compiled View</button>
            </div>
          </div>

          {activeTab === 'compile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">Manual Compilation Tool</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Generate formatted syllabus for print/distribution</p>
                </div>
                <div className="flex gap-2">
                  {(['V', 'VI', 'VII'] as ClassName[]).map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-5 py-2 rounded-xl font-black text-xs transition-all ${selectedClass === cls ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{cls}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                 <div className="w-full max-w-[297mm] overflow-x-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-end mb-4 print-hidden">
                      <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest"><Printer className="h-4 w-4" /> Print PDF</button>
                    </div>
                    <div id="report-preview">
                       <PrintableReport 
                         className={selectedClass} 
                         plans={state.lessonPlans} 
                         teachers={state.teachers}
                         weekStarting={getUpcomingMonday().toISOString()} 
                       />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'registry' && (
            <AdminRegistry 
              teachers={state.teachers} 
              onAddTeacher={async (t) => { setIsSyncing(true); await APIService.syncTeacher(t); await fetchData(); setIsSyncing(false); }} 
              onUpdateTeacher={async (id, upd) => { const teacher = state.teachers.find(t => t.id === id); if (teacher) { await APIService.syncTeacher({...teacher, ...upd}); await fetchData(); } }} 
              onRemoveTeacher={async (id) => { if(confirm("Are you sure you want to remove this teacher from the registry?")) { await APIService.deleteTeacher(id); await fetchData(); } }} 
              lessonPlans={state.lessonPlans}
            />
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight flex items-center gap-3"><Zap className="h-6 w-6 text-indigo-600" /> AI Academic Audit</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Analyze pedagogical quality of current weekly submissions</p>
                </div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest">{isAuditing ? 'Analyzing...' : 'Run Audit'}</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap">{auditResult}</div>}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async (plans) => { setIsSyncing(true); await APIService.saveLessonPlans(plans.map((p: any) => ({...p, id: Math.random().toString(36).substr(2, 9), teacherId: (state.currentUser as Teacher).id, teacherName: (state.currentUser as Teacher).name}))); alert("Lesson plans submitted successfully."); await fetchData(); setIsSyncing(false); }} />
      )}
    </Layout>
  );
};

export default App;
