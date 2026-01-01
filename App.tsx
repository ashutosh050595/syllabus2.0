
import React, { useState, useEffect } from 'react';
import { Teacher, AppState, ClassName, SectionName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS, CLASS_CONFIG, INITIAL_TEACHERS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Loader2, FileText, Printer, MessageCircle, Mail, Download, Send } from 'lucide-react';
import { getUpcomingMonday } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    teachers: [],
    lessonPlans: []
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile'>('plans');
  const [selectedClass, setSelectedClass] = useState<ClassName>('V');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
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
      try {
        if (!user) {
          setState(prev => ({ ...prev, currentUser: null }));
          setIsAuthenticating(false);
          return;
        }

        const email = user.email?.toLowerCase().trim();
        const adminEmail = ADMIN_CREDENTIALS.id.toLowerCase().trim();
        
        if (email === adminEmail) {
          setState(prev => ({ ...prev, currentUser: 'admin' }));
          setIsAuthenticating(false); // Release UI immediately
          fetchData(); // Load data in background
          return;
        }

        // Fast identification using local registry
        const localTeacher = INITIAL_TEACHERS.find(t => t.email.toLowerCase().trim() === email);
        
        // Background verify with Cloud
        const cloudTeachers = await APIService.fetchTeachers();
        let teacher = cloudTeachers.find(t => t.email.toLowerCase().trim() === email);
        
        if (!teacher && localTeacher) {
          await APIService.syncTeacher(localTeacher);
          teacher = localTeacher;
        }

        if (teacher) {
          setState(prev => ({ 
            ...prev, 
            currentUser: teacher as Teacher,
            teachers: cloudTeachers.length > 0 ? cloudTeachers : [teacher as Teacher]
          }));
          setIsAuthenticating(false); // Release UI immediately
          fetchData(); // Load remaining data (lesson plans) in background
        } else {
          alert(`Profile Error: ${user.email} is not registered in the school database.`);
          await APIService.logout();
          setState(prev => ({ ...prev, currentUser: null }));
          setIsAuthenticating(false);
        }
      } catch (err) {
        console.error("Auth Exception:", err);
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

  const handleSendAll = async () => {
    if (!confirm(`Confirm batch dispatch for Class ${selectedClass}?`)) return;
    setIsSendingAll(true);
    try {
      const result = await APIService.triggerBatchDispatch(selectedClass);
      alert(result.message);
    } catch (e) {
      alert("Cloud dispatch failure.");
    } finally {
      setIsSendingAll(false);
    }
  };

  if (isAuthenticating && !state.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Establishing Secure Connection...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl shadow-2xl animate-in zoom-in-95">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-100">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Sacred Heart</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Faculty Hub Login</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><User className="h-4 w-4" /> Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><ShieldCheck className="h-4 w-4" /> Admin</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required placeholder="Institutional Email" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Security Password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-indigo-700 active:scale-95 transition-all">{isSyncing ? 'Authenticating...' : 'Enter Faculty Hub'}</button>
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
              <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><ClipboardList className="h-4 w-4" /> Pedagogical Audit</button>
              <button onClick={() => setActiveTab('registry')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><Users className="h-4 w-4" /> Faculty Registry</button>
              <button onClick={() => setActiveTab('compile')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'compile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}><FileText className="h-4 w-4" /> Compilation</button>
            </div>
          </div>

          {activeTab === 'compile' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8 print:hidden">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Academic Compilation</h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl mt-3 inline-flex">
                    {(['V', 'VI', 'VII'] as ClassName[]).map(cls => (
                      <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-5 py-2 rounded-lg font-black text-xs transition-all ${selectedClass === cls ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{cls}</button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
                  >
                    <Printer className="h-5 w-5" /> Compile All Sections
                  </button>
                  <button 
                    onClick={handleSendAll}
                    disabled={isSendingAll}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-50 disabled:opacity-50"
                  >
                    {isSendingAll ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} 
                    Send All to Class Teachers
                  </button>
                </div>
              </div>
              
              <div className="space-y-24">
                 {CLASS_CONFIG[selectedClass]?.sections.map(section => (
                   <div key={section} className="space-y-6 print:break-after-page">
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex justify-between items-center print:hidden">
                         <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic">{selectedClass}-{section}</div>
                            <p className="text-lg font-black text-slate-800">Section {section} Syllabus</p>
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Engine Connected</p>
                      </div>
                      
                      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none overflow-x-auto">
                         <PrintableReport 
                           className={selectedClass} 
                           sectionName={section}
                           plans={state.lessonPlans} 
                           teachers={state.teachers}
                           weekStarting={getUpcomingMonday().toISOString()} 
                         />
                      </div>
                   </div>
                 ))}
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
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">Generate AI Report</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{auditResult}</div>}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async (plans) => { setIsSyncing(true); await APIService.saveLessonPlans(plans.map((p: any) => ({...p, id: Math.random().toString(36).substr(2, 9), teacherId: (state.currentUser as Teacher).id, teacherName: (state.currentUser as Teacher).name}))); alert("Weekly Syllabus successfully synchronized."); await fetchData(); setIsSyncing(false); }} />
      )}
    </Layout>
  );
};

export default App;
