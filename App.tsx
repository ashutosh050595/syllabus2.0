
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Teacher, AppState, ClassName, SectionName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS, CLASS_CONFIG, INITIAL_TEACHERS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Loader2, FileText, Printer, Send, History, Search, Calendar } from 'lucide-react';
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
  
  // History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const isAuthenticatingRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [teachers, lessonPlans] = await Promise.all([ APIService.fetchTeachers(), APIService.fetchLessonPlans() ]);
      setState(prev => ({ ...prev, teachers, lessonPlans }));
      setLastSynced(new Date());
    } catch (error) { console.error("Data fetch interrupted:", error); } finally { setIsSyncing(false); }
  }, []);

  useEffect(() => {
    // Safety timeout to ensure loader disappears even if Firebase stalls
    const timer = setTimeout(() => { 
      if (isAuthenticatingRef.current) { 
        setIsAuthenticating(false); 
        isAuthenticatingRef.current = false; 
      } 
    }, 4000);

    const unsubscribe = APIService.onAuthChange((user) => {
      setIsAuthenticating(false); 
      isAuthenticatingRef.current = false; 
      clearTimeout(timer);

      if (!user) { 
        setState(prev => ({ ...prev, currentUser: null })); 
        return; 
      }
      
      const email = user.email?.toLowerCase().trim();
      if (email === ADMIN_CREDENTIALS.id.toLowerCase().trim()) { 
        setState(prev => ({ ...prev, currentUser: 'admin' })); 
        fetchData(); 
        return; 
      }

      // Check for matching teacher
      APIService.fetchTeachers().then(ts => { 
        const t = ts.find(x => x.email.toLowerCase().trim() === email); 
        if (t) { 
          setState(prev => ({...prev, currentUser: t, teachers: ts})); 
          fetchData(); 
        } else {
          // If no cloud match, check local registry constants
          const local = INITIAL_TEACHERS.find(x => x.email.toLowerCase().trim() === email);
          if (local) {
             setState(prev => ({...prev, currentUser: local}));
             fetchData();
          } else {
             APIService.logout();
          }
        }
      });
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) { alert(res.message); setIsSyncing(false); }
  };

  const handleLogout = async () => { setIsAuthenticating(true); isAuthenticatingRef.current = true; await APIService.logout(); };

  const filteredHistory = state.lessonPlans.filter(p => {
    const matchesText = p.teacherName.toLowerCase().includes(historySearch.toLowerCase()) ||
                      p.subject.toLowerCase().includes(historySearch.toLowerCase());
    const matchesDate = !historyDateFilter || p.dateFrom === historyDateFilter;
    return matchesText && matchesDate;
  });

  // PRE-RENDER LOADER
  if (isAuthenticating && !state.currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-slate-900 font-black text-xl italic tracking-tighter uppercase">Securing Connection...</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 animate-pulse">Institutional Hub Access</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-indigo-600 rounded-3xl mb-8 shadow-xl shadow-indigo-100">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Sacred Heart</h2>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-3 opacity-60">Staff Portal Security</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200">
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-400'}`}><User className="h-4 w-4" /> Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-400'}`}><ShieldCheck className="h-4 w-4" /> Admin</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required placeholder="Institutional Email" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Security Key" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 transition-colors outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-50 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 active:scale-95 transition-all">
              {isSyncing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enter Hub'}
            </button>
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
              <button onClick={() => setActiveTab('plans')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Academic Audit</button>
              <button onClick={() => setActiveTab('registry')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Faculty Registry</button>
              <button onClick={() => setActiveTab('compile')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'compile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Compilation</button>
              <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}>Full History</button>
            </div>
          </div>

          {activeTab === 'history' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3 text-slate-900"><History className="h-6 w-6 text-indigo-600" /> Institutional Logs</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Audit all faculty submissions by range and member</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Teacher or Subject..." 
                      className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48"
                      value={historyDateFilter}
                      onChange={e => setHistoryDateFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map(plan => (
                  <div key={plan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 italic">{plan.className}</div>
                        <div>
                          <p className="font-black text-slate-900">{plan.teacherName}</p>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{plan.subject}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">
                        Coverage: {plan.weekLabel || plan.dateFrom}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-[10px] font-bold text-slate-500 italic">LOGGED: {new Date(plan.submittedAt).toLocaleString()}</p>
                      {plan.resubmissionStatus && plan.resubmissionStatus !== 'none' && (
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg mt-2 inline-block shadow-sm ${
                          plan.resubmissionStatus === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                          plan.resubmissionStatus === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>Status: {plan.resubmissionStatus}</span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredHistory.length === 0 && <div className="py-24 text-center text-slate-400 font-bold uppercase italic border border-dashed border-slate-200 rounded-3xl">No records found for current filters.</div>}
              </div>
            </div>
          )}

          {activeTab === 'compile' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8 print:hidden">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Academic Compilation</h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl mt-4 inline-flex border border-slate-200">
                    {(['V', 'VI', 'VII'] as ClassName[]).map(cls => (
                      <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-8 py-2.5 rounded-lg font-black text-xs transition-all uppercase tracking-widest ${selectedClass === cls ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{cls}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 hover:bg-black transition-all shadow-xl shadow-slate-200"><Printer className="h-5 w-5" /> Compile Class PDF</button>
                </div>
              </div>
              <div className="space-y-24">
                 {CLASS_CONFIG[selectedClass]?.sections.map(section => (
                   <div key={section} className="space-y-8 print:break-after-page">
                      <div className="bg-slate-100 border border-slate-200 p-6 rounded-[2rem] flex justify-between items-center print:hidden">
                         <div className="flex items-center gap-5">
                            <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-lg shadow-indigo-100">{selectedClass}-{section}</div>
                            <div>
                               <p className="text-xl font-black text-slate-900 uppercase italic">Section {section} Syllabus</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Automated compilation active</p>
                            </div>
                         </div>
                      </div>
                      <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none overflow-x-auto">
                         <PrintableReport className={selectedClass} sectionName={section} plans={state.lessonPlans} teachers={state.teachers} weekStarting={getUpcomingMonday().toISOString()} />
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
              onAddTeacher={async t => { await APIService.syncTeacher(t); fetchData(); }} 
              onUpdateTeacher={async (id, upd) => { const t = state.teachers.find(x => x.id === id); if (t) { await APIService.syncTeacher({...t, ...upd}); fetchData(); } }} 
              onRemoveTeacher={async id => { if(confirm("Permanently remove member?")) { await APIService.deleteTeacher(id); fetchData(); } }} 
            />
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm gap-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tight flex items-center gap-4 uppercase"><Zap className="h-8 w-8 text-indigo-600" /> Academic Auditor</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Evaluate syllabus coverage and pedagogical quality</p>
                </div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-50 disabled:opacity-50">Generate Evaluation</button>
              </div>
              {auditResult && <div className="bg-white p-12 rounded-[3rem] border-2 border-slate-100 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed italic">{auditResult}</div>}
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async plans => { setIsSyncing(true); await APIService.saveLessonPlans(plans); alert("Weekly Syllabus successfully synchronized."); fetchData(); }} />
      )}
    </Layout>
  );
};

export default App;
