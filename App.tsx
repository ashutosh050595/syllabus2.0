
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail, GraduationCap
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api';
import { INITIAL_TEACHERS } from './constants';
import Layout from './components/Layout';
import AdminRegistry from './components/AdminRegistry';
import AdminCompiler from './components/AdminCompiler';
import TeacherForm from './components/TeacherForm';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [] 
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry' | 'compile' | 'history' | 'logins' | 'requests'>('registry');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const fetchData = useCallback(async (userOverride?: any) => {
    const user = userOverride || state.currentUser;
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // Safety timeout to prevent infinite spinner
      const dataPromise = Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans(),
        user === 'admin' ? APIService.fetchLoginLogs() : Promise.resolve([])
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );

      const [teachers, lessonPlans, loginLogs] = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      // Auto-Seed Check: If admin logs in and registry is empty
      if (user === 'admin' && teachers.length === 0) {
        await APIService.syncInitialTeachers(INITIAL_TEACHERS);
        const refreshedTeachers = await APIService.fetchTeachers();
        setState(prev => ({ ...prev, teachers: refreshedTeachers, lessonPlans, loginLogs }));
      } else {
        setState(prev => ({ ...prev, teachers, lessonPlans, loginLogs }));
      }
      
      setLastSynced(new Date());
    } catch (e) {
      console.error("Sync Failure or Timeout:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [state.currentUser]);

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('shs_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setState(prev => ({ ...prev, currentUser: parsedUser }));
          await fetchData(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('shs_user');
      } finally {
        setIsAuthenticating(false); // CRITICAL: Always release auth lock
      }
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      if (loginMode === 'admin') {
        const { ADMIN_CREDENTIALS } = await import('./constants');
        if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
          const user = 'admin' as const;
          setState(prev => ({ ...prev, currentUser: user }));
          localStorage.setItem('shs_user', JSON.stringify(user));
          await fetchData(user);
          return;
        } else {
          alert("Admin Access Denied.");
          return;
        }
      }

      let teachers = state.teachers;
      if (teachers.length === 0) teachers = await APIService.fetchTeachers();

      const teacher = teachers.find(t => t.email.toLowerCase().trim() === loginEmail.toLowerCase().trim());
      const { DEFAULT_TEACHER_PASSWORD } = await import('./constants');
      const expectedPass = teacher?.password || DEFAULT_TEACHER_PASSWORD;

      if (teacher && loginPassword === expectedPass) {
        setState(prev => ({ ...prev, currentUser: teacher, teachers }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
        await fetchData(teacher);
      } else {
        alert("Login Failed. Verify credentials.");
      }
    } catch (err) {
      alert("Network Error. Proceeding to offline mode...");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null, teachers: [], lessonPlans: [], loginLogs: [] }));
    localStorage.removeItem('shs_user');
    setLastSynced(null);
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional Protocol Active</p>
        </div>
      </div>
    );
  }
  // ... Rest of the component ...
  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={() => fetchData()}
      isSyncing={isSyncing}
      lastSynced={lastSynced}
    >
      {state.currentUser === 'admin' ? (
        <div className="space-y-8">
          <div className="flex justify-center flex-wrap gap-2 print-hidden">
            {[
              { id: 'registry', label: 'Faculty Registry', icon: Users },
              { id: 'compile', label: 'Pdf Compilation', icon: Printer },
              { id: 'requests', label: `Edit Requests`, icon: AlertCircle },
              { id: 'plans', label: 'AI Audit', icon: Zap },
              { id: 'history', label: 'Archive', icon: History },
              { id: 'logins', label: 'Access Logs', icon: Key }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'registry' && (
              <AdminRegistry 
                teachers={state.teachers}
                lessonPlans={state.lessonPlans}
                onAddTeacher={async (t) => { await APIService.addTeacher(t); await fetchData(); }}
                onUpdateTeacher={async (id, upd) => { await APIService.updateTeacher(id, upd); await fetchData(); }}
                onRemoveTeacher={async (id) => { await APIService.removeTeacher(id); await fetchData(); }}
              />
            )}
            {activeTab === 'compile' && <AdminCompiler lessonPlans={state.lessonPlans} teachers={state.teachers} />}
            {/* ... other admin tabs ... */}
          </div>
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          history={state.lessonPlans.filter(p => p.teacherId === (state.currentUser as Teacher).email)} 
        />
      )}
    </Layout>
  );
};

export default App;
