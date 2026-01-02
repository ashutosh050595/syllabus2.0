
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Teacher, AppState, ClassName, LessonPlan, LoginLog, SectionName } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import PrintableReport from './components/PrintableReport';
import { ADMIN_CREDENTIALS, CLASS_CONFIG, INITIAL_TEACHERS } from './constants';
import { ShieldCheck, Zap, Loader2, Printer, History, Search, Mail, MessageSquare, Download, Users, Key, AlertCircle } from 'lucide-react';
import { getUpcomingMonday, getWeekLabel } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ currentUser: null, teachers: [], lessonPlans: [], loginLogs: [] });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history' | 'logins'>('plans');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', type: 'teacher' as 'teacher' | 'admin' });
  
  const authHandledRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [teachers, lessonPlans, loginLogs] = await Promise.all([ 
        APIService.fetchTeachers(), 
        APIService.fetchLessonPlans(),
        APIService.fetchLoginLogs()
      ]);
      setState(prev => ({ ...prev, teachers, lessonPlans, loginLogs }));
      setLastSynced(new Date());
    } catch (error) { 
      console.error("Fetch Error:", error); 
    } finally { 
      setIsSyncing(false); 
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (!authHandledRef.current) setIsAuthenticating(false); }, 3000);
    const unsubscribe = APIService.onAuthChange(async (user) => {
      authHandledRef.current = true;
      clearTimeout(timer);
      if (!user) {
        setState(prev => ({ ...prev, currentUser: null }));
        setIsAuthenticating(false);
        return;
      }
      const email = user.email?.toLowerCase().trim();
      if (email === ADMIN_CREDENTIALS.id.toLowerCase().trim()) {
        setState(prev => ({ ...prev, currentUser: 'admin' }));
        fetchData(); 
      } else {
        // First check in fetched teachers, then fallback to initial constant
        const match = state.teachers.find(t => t.email.toLowerCase().trim() === email) || INITIAL_TEACHERS.find(t => t.email.toLowerCase().trim() === email);
        setState(prev => ({ ...prev, currentUser: match || null }));
        fetchData();
      }
      setIsAuthenticating(false);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [fetchData, state.teachers]);

  const handleLogout = async () => {
    setIsAuthenticating(true);
    authHandledRef.current = false;
    await APIService.logout();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const res = await APIService.login(loginForm.email, loginForm.password);
    if (!res.success) { alert(res.message); setIsSyncing(false); }
  };

  const upcomingMonday = getUpcomingMonday();
  const weekLabel = getWeekLabel(upcomingMonday);
  
  const currentWeekPlans = state.lessonPlans.filter(p => p.weekStarting === upcomingMonday.toISOString());
  const submittedTeacherIds = new Set(currentWeekPlans.map(p => p.teacherId));
  const defaulters = state.teachers.filter(t => !submittedTeacherIds.has(t.email));

  const handleEmailDefaulters = async () => {
    if (defaulters.length === 0) return alert("All faculty compliant.");
    if (!confirm(`Send alerts to ${defaulters.length} teachers?`)) return;
    setIsSyncing(true);
    await APIService.emailDefaulters(defaulters, weekLabel);
    alert("Alerts dispatched via engine.");
    setIsSyncing(false);
  };

  const handleWhatsApp = (teacher: Teacher, className: string, section: string) => {
    const msg = encodeURIComponent(`Sacred Heart School: Hi ${teacher.name}, please submit the lesson plan for Class ${className}-${section} for the week ${weekLabel}.`);
    window.open(`https://wa.me/91${teacher.phone}?text=${msg}`, '_blank');
  };

  const handleDirectEmail = (teacher: Teacher, className: string, section: string) => {
    const subject = encodeURIComponent(`Urgent: Lesson Plan Pending for ${className}${section}`);
    const body = encodeURIComponent(`Dear ${teacher.name},\n\nYour weekly syllabus for ${className}-${section} is currently pending. Please login to the portal and update it.\n\nRegards,\nSacred Heart Admin`);
    window.location.href = `mailto:${teacher.email}?subject=${subject}&body=${body}`;
  };

  const handleSendToCT = async (teacher: Teacher, className: string, section: string) => {
    if (!confirm(`Email compiled report to ${teacher.name}?`)) return;
    setIsSyncing(true);
    await APIService.sendCompiledToCT(teacher, className, section, weekLabel);
    alert("Queued for processing.");
    setIsSyncing(false);
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Check...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-6"><ShieldCheck className="h-8 w-8 text-white" /></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Institutional Access</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setLoginForm({...loginForm, type: 'teacher'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase ${loginForm.type === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Faculty</button>
            <button onClick={() => setLoginForm({...loginForm, type: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase ${loginForm.type === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Admin</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Institutional Email" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-600 outline-none" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            <input type="password" required placeholder="Access Key" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-600 outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button disabled={isSyncing} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">{isSyncing ? 'Verifying...' : 'Access Portal'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout user={state.currentUser} onLogout={handleLogout} onRefresh={fetchData} isSyncing={isSyncing} lastSynced={lastSynced}>
      {state.currentUser === 'admin' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl"><Users className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Access Today</p><p className="text-xl font-black text-slate-900">{state.loginLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl"><History className="h-5 w-5 text-indigo-600" /></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Submissions</p><p className="text-xl font-black text-slate-900">{currentWeekPlans.length}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-rose-50 p-3 rounded-xl"><AlertCircle className="h-5 w-5 text-rose-600" /></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Pending</p><p className="text-xl font-black text-slate-900">{defaulters.length}</p></div>
            </div>
            <button onClick={handleEmailDefaulters} disabled={isSyncing} className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-center items-center gap-1 hover:bg-black transition-all active:scale-95">
              {isSyncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5 mb-1" />}
              <span className="text-[9px] font-black uppercase tracking-widest">Email Defaulters</span>
            </button>
          </div>

          <div className="flex justify-center flex-wrap gap-2">
            {[
              { id: 'plans', label: 'Audit', icon: Zap },
              { id: 'registry', label: 'Faculty', icon: Users },
              { id: 'compile', label: 'Compilation', icon: Printer },
              { id: 'history', label: 'Records', icon: History },
              { id: 'logins', label: 'Logins', icon: Key }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'compile' && (
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight">Weekly Compilation Deck</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Period: {weekLabel}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"><Printer className="h-4 w-4" /> Compile All Classes</button>
                    <button onClick={async () => { if(confirm("Send to all CTs?")) { setIsSyncing(true); for(const ct of state.teachers.filter(t => t.isClassTeacher)) { await APIService.sendCompiledToCT(ct, ct.classTeacherOf!.className, ct.classTeacherOf!.section, weekLabel); } alert("Bulk dispatch triggered."); setIsSyncing(false); } }} disabled={isSyncing} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95">{isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send All to CTs</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(CLASS_CONFIG).map(([className, config]) => 
                    config.sections.map(section => {
                      const ct = state.teachers.find(t => t.isClassTeacher && t.classTeacherOf?.className === className && t.classTeacherOf?.section === section);
                      return (
                        <div key={`${className}-${section}`} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:border-indigo-200 transition-all">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-xl italic shadow-sm">{className}{section}</div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">In-Charge</p>
                               <span className="text-[9px] font-black text-slate-700 uppercase">{ct?.name || 'VACANT'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => window.print()} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all active:scale-90" title="Download PDF"><Download className="h-4 w-4" /></button>
                             <button onClick={() => ct && handleDirectEmail(ct, className, section)} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-all active:scale-90" title="Send Gmail"><Mail className="h-4 w-4" /></button>
                             <button onClick={() => ct && handleWhatsApp(ct, className, section)} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-green-600 flex items-center justify-center transition-all active:scale-90" title="Send WhatsApp"><MessageSquare className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <div className="hidden print:block space-y-20">
                {Object.entries(CLASS_CONFIG).map(([className, config]) => 
                  config.sections.map(section => (
                    <div key={`print-${className}-${section}`} className="page-break-after">
                      <PrintableReport className={className as ClassName} sectionName={section as SectionName} plans={state.lessonPlans} teachers={state.teachers} weekStarting={upcomingMonday.toISOString()} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3"><Zap className="h-6 w-6 text-indigo-600" /> Academic Auditor</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit pedagogical coverage of submissions</p>
                </div>
                <button onClick={async () => { setIsAuditing(true); const res = await APIService.generateAIAudit(state.lessonPlans); setAuditResult(res); setIsAuditing(false); }} disabled={isAuditing || state.lessonPlans.length === 0} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95">Run AI Audit</button>
              </div>
              {auditResult && <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-100 shadow-sm font-bold text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{auditResult}</div>}
            </div>
          )}

          {activeTab === 'registry' && <AdminRegistry teachers={state.teachers} lessonPlans={state.lessonPlans} onAddTeacher={async t => { await APIService.syncTeacher(t); fetchData(); }} onUpdateTeacher={async (id, upd) => { const t = state.teachers.find(x => x.id === id); if (t) { await APIService.syncTeacher({...t, ...upd}); fetchData(); } }} onRemoveTeacher={async id => { if(confirm("Permanently delete faculty record?")) { await APIService.deleteTeacher(id); fetchData(); } }} />}
          
          {(activeTab === 'history' || activeTab === 'logins') && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
               <h3 className="text-lg font-black uppercase italic tracking-tight">{activeTab === 'logins' ? 'Institutional Access History' : 'Full Academic Records'}</h3>
               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeTab === 'logins' ? state.loginLogs.map((log, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <div><p className="font-black text-slate-800 text-sm">{log.email}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{log.device}</p></div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  )) : state.lessonPlans.map(plan => (
                    <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                       <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-xs italic">{plan.className}</div>
                          <div><p className="font-black text-slate-800 text-sm leading-tight">{plan.teacherName}</p><p className="text-[9px] font-black text-indigo-500 uppercase">{plan.subject} • {plan.weekLabel}</p></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      ) : (
        <TeacherForm teacher={state.currentUser as Teacher} onSubmit={async plans => { setIsSyncing(true); await APIService.saveLessonPlans(plans); fetchData(); setIsSyncing(false); }} />
      )}
    </Layout>
  );
};

export default App;
