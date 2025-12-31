
import React, { useState, useEffect } from 'react';
import { Teacher, AppState } from './types';
import { APIService } from './services/api';
import Layout from './components/Layout';
import TeacherForm from './components/TeacherForm';
import AdminRegistry from './components/AdminRegistry';
import { ADMIN_CREDENTIALS } from './constants';
import { ClipboardList, Users, LogIn } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    teachers: [],
    lessonPlans: []
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'registry'>('plans');
  const [isSyncing, setIsSyncing] = useState(false);
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
            <div className="grid grid-cols-1 gap-6">
              <div className="text-white text-center py-20 opacity-50 font-black uppercase tracking-widest text-sm italic">
                Select Faculty Registry to manage staff
              </div>
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
