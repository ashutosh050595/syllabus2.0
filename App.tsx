
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Teacher, AppState, ClassName, SectionName, LessonPlan } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS, CLASS_CONFIG, INITIAL_TEACHERS } from './constants';
import { ClipboardList, Users, LogIn, ShieldCheck, Zap, User, Loader2, FileText, Printer, Send, History, Search } from 'lucide-react';
import { getUpcomingMonday } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ currentUser: null, teachers: [], lessonPlans: [] });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history'>('plans');
  const [selectedClass, setSelectedClass] = useState<ClassName>('V');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'teacher' as 'teacher' | 'admin' });
  const [historySearch, setHistorySearch] = useState('');

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
    const timer = setTimeout(() => { if (isAuthenticatingRef.current) { setIsAuthenticating(false); isAuthenticatingRef.current = false; } }, 2500);
    const unsubscribe = APIService.onAuthChange((user) => {
      setIsAuthenticating(false); isAuthenticatingRef.current = false; clearTimeout(timer);
      if (!user) { setState(prev => ({ ...prev, currentUser: null })); return; }
      const email = user.email?.toLowerCase().trim();
      if (email === ADMIN_CREDENTIALS.id.toLowerCase().trim()) { 
        setState(prev => ({ ...prev, currentUser: 'admin' })); 
        fetchData(); 
        return; 
      }
      const localProfile = INITIAL_TEACHERS.find(t => t.email.toLowerCase().trim() === email);
      if (localProfile) { 
        setState(prev => ({ ...prev, currentUser: localProfile })); 
        fetchData(); 
      }
      else { 
        APIService.fetchTeachers().then(ts => { 
          const t = ts.find(x => x.email.toLowerCase().trim() === email); 
          if (t) { setState(prev => ({...prev, currentUser: t, teachers: ts})); fetchData(); } 
          else { APIService.logout(); } 
        }); 
      }
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) { alert(res.message); setIsSyncing(false); }
  };

  const handleLogout = async () => { setIsAuthenticating(true); isAuthenticatingRef.current = true; await APIService.logout(); };

  const filteredHistory = state.lessonPlans.filter(p => 
    p.teacherName.toLowerCase().includes(historySearch.toLowerCase()) ||
    p.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
    p.className.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <Layout user={state.currentUser} onLogout={handleLogout} onRefresh={fetchData} isSyncing={isSyncing} lastSynced={lastSynced}>
      {state.currentUser === 'admin' ? (
        <div className="space-y-10">
          <div className="flex flex-wrap justify-center gap-2">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
              <button onClick={() => setActiveTab('plans')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plans' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Audit</button>
              <button onClick={() => setActiveTab('registry')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Faculty</button>
              <button onClick={() => setActiveTab('compile')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'compile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Compilation</button>
              <button onClick={() => setActiveTab('history')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>History</button>
            </div>
          </div>

          {activeTab === 'history' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-black uppercase tracking-tight">Faculty Submission Logs</h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by teacher or subject..." 
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map(plan => (
                  <div key={plan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800">{plan.teacherName}</p>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-tighter">{plan.className}-{plan.subject}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Coverage: {plan.weekLabel || plan.dateFrom}
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0 text-right">
                      <p className="text-xs font-bold text-slate-500 italic">Logs: {new Date(plan.submittedAt).toLocaleString()}</p>
                      {plan.resubmissionStatus && plan.resubmissionStatus !== 'none' && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                          plan.resubmissionStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          plan.resubmissionStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>Status: {plan.resubmissionStatus}</span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredHistory.length === 0 && <div className="py-20 text-center text-slate-400 font-bold uppercase italic">No records found matching search.</div>}
              </div>
            </div>
          )}

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
                  <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"><Printer className="h-5 w-5" /> Compile All Sections</button>
                </div>
              </div>
              <div className="space-y-24">
                 {CLASS_CONFIG[selectedClass]?.sections.map(section => (
                   <div key={section} className="space-y-6 print:break-after-page">
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex justify-between items-center print:hidden">
                         <div className="flex items-center gap-4"><div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic">{selectedClass}-{section}</div><p className="text-lg font-black text-slate-800">Section {section} Syllabus</p></div>
                      </div>
                      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none overflow-x-auto">
                         <PrintableReport className={selectedClass} sectionName={section} plans={state.lessonPlans} teachers={state.teachers} weekStarting={getUpcomingMonday().toISOString()} />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'registry' && (
            <AdminRegistry teachers={state.teachers} lessonPlans={state.lessonPlans} onAddTeacher={async t => { await APIService.syncTeacher(t); fetchData(); }} onUpdateTeacher={async (id, upd) => { const t = state.teachers.find(x => x.id === id); if (t) { await APIService.syncTeacher({...t, ...upd}); fetchData(); } }} onRemoveTeacher={async id => { if(confirm("Remove?")) { await APIService.deleteTeacher(id); fetchData(); } }} />
          )}

          {activeTab === 'plans' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm gap-6">
                <div><h3 className="text-2xl font-black text-slate-900 italic tracking-tight flex items-center gap-3"><Zap className="h-6 w-6 text-indigo-600" /> Academic Auditor Engine</h3></div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">Generate AI Report</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{auditResult}</div>}
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
