
import React, { useState, useEffect, useCallback } from 'react';
import { Teacher, AppState, ClassName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS, CLASS_CONFIG, INITIAL_TEACHERS } from './constants';
import { LogIn, ShieldCheck, Zap, User, Loader2, Printer, History, Search, Calendar } from 'lucide-react';
import { getUpcomingMonday } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ currentUser: null, teachers: [], lessonPlans: [] });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history'>('plans');
  const [selectedClass, setSelectedClass] = useState<ClassName>('V');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'teacher' as 'teacher' | 'admin' });
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [teachers, lessonPlans] = await Promise.all([ APIService.fetchTeachers(), APIService.fetchLessonPlans() ]);
      setState(prev => ({ ...prev, teachers, lessonPlans }));
      setLastSynced(new Date());
    } catch (error) { 
      console.error("Fetch Error:", error); 
    } finally { 
      setIsSyncing(false); 
    }
  }, []);

  useEffect(() => {
    const unsubscribe = APIService.onAuthChange(async (user) => {
      if (!user) {
        setState(prev => ({ ...prev, currentUser: null }));
        setIsAuthenticating(false);
        return;
      }

      const email = user.email?.toLowerCase().trim();
      
      // 1. Admin Check
      if (email === ADMIN_CREDENTIALS.id.toLowerCase().trim()) {
        setState(prev => ({ ...prev, currentUser: 'admin' }));
        await fetchData();
        setIsAuthenticating(false);
        return;
      }

      // 2. Teacher Check
      const cloudTeachers = await APIService.fetchTeachers();
      const match = cloudTeachers.find(t => t.email.toLowerCase().trim() === email) || 
                    INITIAL_TEACHERS.find(t => t.email.toLowerCase().trim() === email);

      if (match) {
        setState(prev => ({ ...prev, currentUser: match, teachers: cloudTeachers }));
        await fetchData();
      } else {
        await APIService.logout();
      }
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) {
      alert(res.message);
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticating(true);
    await APIService.logout();
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-slate-900 font-black text-xs uppercase tracking-[0.3em]">Authenticating Portal...</h2>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-6 shadow-lg shadow-indigo-100">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Sacred Heart Portal</h2>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 border border-slate-200">
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Admin</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Institutional Email" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-600 outline-none" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Security Key" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-600 outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-[10px] hover:bg-indigo-700 disabled:opacity-50">
              {isSyncing ? 'Processing...' : 'Access Hub'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredHistory = state.lessonPlans.filter(p => {
    const matchesText = p.teacherName.toLowerCase().includes(historySearch.toLowerCase()) || p.subject.toLowerCase().includes(historySearch.toLowerCase());
    const matchesDate = !historyDateFilter || p.dateFrom === historyDateFilter;
    return matchesText && matchesDate;
  });

  return (
    <Layout user={state.currentUser} onLogout={handleLogout} onRefresh={fetchData} isSyncing={isSyncing} lastSynced={lastSynced}>
      {state.currentUser === 'admin' ? (
        <div className="space-y-10">
          <div className="flex justify-center">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1">
              {(['plans', 'registry', 'compile', 'history'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>{tab.replace('plans', 'Audit')}</button>
              ))}
            </div>
          </div>

          {activeTab === 'history' && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2"><History className="h-5 w-5 text-indigo-600" /> Submission Logs</h3>
                <div className="flex gap-2 w-full md:w-auto">
                   <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                   </div>
                   <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={historyDateFilter} onChange={e => setHistoryDateFilter(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map(plan => (
                  <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-xs italic">{plan.className}</div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight">{plan.teacherName}</p>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{plan.subject} • {plan.weekLabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">LOGGED {new Date(plan.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'registry' && <AdminRegistry teachers={state.teachers} lessonPlans={state.lessonPlans} onAddTeacher={async t => { await APIService.syncTeacher(t); fetchData(); }} onUpdateTeacher={async (id, upd) => { const t = state.teachers.find(x => x.id === id); if (t) { await APIService.syncTeacher({...t, ...upd}); fetchData(); } }} onRemoveTeacher={async id => { if(confirm("Remove member?")) { await APIService.deleteTeacher(id); fetchData(); } }} />}
          
          {activeTab === 'compile' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {(['V', 'VI', 'VII'] as ClassName[]).map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-6 py-2 rounded-md font-black text-[10px] transition-all uppercase tracking-widest ${selectedClass === cls ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{cls}</button>
                  ))}
                </div>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl"><Printer className="h-4 w-4" /> Export Class PDF</button>
              </div>
              <div className="space-y-16">
                 {CLASS_CONFIG[selectedClass]?.sections.map(section => (
                   <div key={section} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none overflow-x-auto">
                      <PrintableReport className={selectedClass} sectionName={section} plans={state.lessonPlans} teachers={state.teachers} weekStarting={getUpcomingMonday().toISOString()} />
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3"><Zap className="h-6 w-6 text-indigo-600" /> Academic Auditor</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit pedagogical quality across all faculty</p>
                </div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 disabled:opacity-50">Run AI Audit</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed italic">{auditResult}</div>}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async plans => { setIsSyncing(true); await APIService.saveLessonPlans(plans); fetchData(); }} />
      )}
    </Layout>
  );
};

export default App;
