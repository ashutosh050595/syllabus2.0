
import React, { useState, useEffect } from 'react';
import { Teacher, AppState, ClassName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Loader2, FileText, Printer, MessageCircle, Mail, Download } from 'lucide-react';
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
          const normalizedUserEmail = user.email?.toLowerCase().trim();
          const adminEmail = ADMIN_CREDENTIALS.id.toLowerCase().trim();
          
          if (normalizedUserEmail === adminEmail) {
            setState(prev => ({ ...prev, currentUser: 'admin' }));
            await fetchData();
          } else {
            // Robust lookup for teachers (Fixes Radha Singh and others)
            const { teachers } = await fetchData();
            const teacher = teachers.find(t => t.email.toLowerCase().trim() === normalizedUserEmail);
            
            if (teacher) {
              setState(prev => ({ ...prev, currentUser: teacher }));
            } else {
              // Deep sync fallback for profile lookup failures
              const freshTeachers = await APIService.fetchTeachers();
              const freshTeacher = freshTeachers.find(t => t.email.toLowerCase().trim() === normalizedUserEmail);
              if (freshTeacher) {
                setState(prev => ({ ...prev, currentUser: freshTeacher, teachers: freshTeachers }));
              } else {
                alert(`Institutional Registry Error: Profile (${user.email}) not found. Please contact Administration.`);
                await APIService.logout();
                setState(prev => ({ ...prev, currentUser: null }));
              }
            }
          }
        } else {
          setState(prev => ({ ...prev, currentUser: null }));
        }
      } catch (err) {
        console.error("Auth state error:", err);
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
      alert(`Login Failed: ${res.message}`);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticating(true);
    await APIService.logout();
    setState(prev => ({ ...prev, currentUser: null }));
    setIsAuthenticating(false);
  };

  const shareViaWhatsApp = () => {
    const text = `Sacred Heart Koderma - Class ${selectedClass} Weekly Syllabus is ready for review. Access via: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Compiled Weekly Syllabus - Class ${selectedClass}`;
    const body = `Dear Faculty,\n\nThe compiled lesson plans for Class ${selectedClass} for the upcoming week have been generated.\n\nPlease review them in the portal.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isAuthenticating && !state.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verifying Cloud Credentials...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-100">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Sacred Heart</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Faculty Hub Authentication</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><User className="h-4 w-4" /> Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><ShieldCheck className="h-4 w-4" /> Admin</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required placeholder="email@sacredheartkoderma.org" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Enter Security Password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-indigo-700 active:scale-95 transition-all">{isSyncing ? 'Authenticating...' : 'Sign In'}</button>
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
              <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><ClipboardList className="h-4 w-4" /> AI Pedagogical Audit</button>
              <button onClick={() => setActiveTab('registry')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><Users className="h-4 w-4" /> Faculty Registry</button>
              <button onClick={() => setActiveTab('compile')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'compile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><FileText className="h-4 w-4" /> Syllabus Compilation</button>
            </div>
          </div>

          {activeTab === 'compile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
                <div className="text-center xl:text-left">
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Academic Compilation Tool</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Audit submissions and distribute reports class-wise</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['V', 'VI', 'VII'] as ClassName[]).map(cls => (
                      <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-5 py-2 rounded-lg font-black text-xs transition-all ${selectedClass === cls ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{cls}</button>
                    ))}
                  </div>
                  <div className="h-10 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md"><Download className="h-4 w-4" /> Download PDF</button>
                    <button onClick={shareViaEmail} className="bg-white border-2 border-slate-200 text-slate-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-indigo-600 hover:text-indigo-600 transition-all"><Mail className="h-4 w-4" /> Email</button>
                    <button onClick={shareViaWhatsApp} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-50"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                 <div className="w-full max-w-[297mm] overflow-x-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none">
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
              onRemoveTeacher={async (id) => { if(confirm("Permanently remove this teacher?")) { await APIService.deleteTeacher(id); await fetchData(); } }} 
              lessonPlans={state.lessonPlans}
            />
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight flex items-center gap-3"><Zap className="h-6 w-6 text-indigo-600" /> Academic Auditor Engine</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Evaluate curriculum quality and home assignment rigor</p>
                </div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50">{isAuditing ? 'Analyzing...' : 'Generate AI Report'}</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-4">{auditResult}</div>}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async (plans) => { setIsSyncing(true); await APIService.saveLessonPlans(plans.map((p: any) => ({...p, id: Math.random().toString(36).substr(2, 9), teacherId: (state.currentUser as Teacher).id, teacherName: (state.currentUser as Teacher).name}))); alert("Weekly Syllabus successfully synchronized to cloud registry."); await fetchData(); setIsSyncing(false); }} />
      )}
    </Layout>
  );
};

export default App;
