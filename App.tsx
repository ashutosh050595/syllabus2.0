import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail, 
  GraduationCap, FileText, User, Clock, AlertTriangle,
  Database, Wifi, WifiOff, Cloud, CloudOff
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from './constants';
import Layout from './components/Layout';
import { normalizeEmail } from "./utils/identity";
import AdminRegistry from './components/AdminRegistry';
import AdminCompiler from './components/AdminCompiler';
import TeacherForm from './components/TeacherForm';
import SubmissionHistory from './components/SubmissionHistory';
import DefaultersList from './components/DefaultersList';
import TeacherLoginHistory from './components/TeacherLoginHistory';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [] 
  });
  const [activeTab, setActiveTab] = useState<'registry' | 'submissions' | 'defaulters' | 'teacher-logins' | 'compile' | 'logins'>('registry');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSeeded, setIsSeeded] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string>('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 🔄 Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError('No internet connection. Please check your network.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ✅ Check database seed status
  const checkIfSeeded = useCallback(async () => {
    try {
      console.log("🔍 Checking database seed status...");
      const teachers = await APIService.fetchTeachers();
      const seeded = teachers.length > 0;
      setIsSeeded(seeded);
      console.log(`✅ Database status: ${seeded ? 'Seeded' : 'Not Seeded'} (${teachers.length} teachers)`);
      return seeded;
    } catch (error) {
      console.error("❌ Error checking database seed:", error);
      setIsSeeded(false);
      setConnectionError('Cannot connect to database. Check internet or try again later.');
      return false;
    }
  }, []);

  // ✅ Emergency manual seed function
  const handleManualSeed = async () => {
    try {
      setIsSyncing(true);
      setLoginError('');
      console.log("🌱 Starting manual database seed...");
      
      // First check if already seeded
      const teachers = await APIService.fetchTeachers();
      if (teachers.length > 0) {
        setLoginError("Database already seeded. Please try logging in.");
        setIsSyncing(false);
        return;
      }
      
      // Seed the database
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      console.log("✅ Database seeded successfully!");
      
      // Reload teachers
      await checkIfSeeded();
      
      setLoginError("✅ Database seeded successfully! Try logging in now.");
      setTimeout(() => {
        setLoginError('');
      }, 3000);
    } catch (error: any) {
      console.error("❌ Manual seed failed:", error);
      setLoginError(`Seed failed: ${error.message}. Please try again or contact administrator.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ Fetch all data
  const fetchData = useCallback(async (userOverride?: any) => {
    const user = userOverride || state.currentUser;
    if (!user) {
      setIsAuthenticating(false);
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log("📡 Fetching data from Firestore...");
      
      const [teachers, lessonPlans, loginLogs] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans(),
        user === 'admin' ? APIService.fetchLoginLogs() : Promise.resolve([])
      ]);
      
      console.log(`✅ Fetched: ${teachers.length} teachers, ${lessonPlans.length} lesson plans, ${loginLogs.length} login logs`);
      
      // Check if database needs seeding
      if (teachers.length === 0 && (isSeeded === false || isSeeded === null)) {
        console.log("⚠️ Database is empty. Seeding needed...");
        
        // Only admin can seed automatically
        if (user === 'admin') {
          try {
            console.log("🌱 Admin seeding database...");
            await APIService.syncInitialTeachers(INITIAL_TEACHERS);
            const refreshedTeachers = await APIService.fetchTeachers();
            setState(prev => ({ ...prev, teachers: refreshedTeachers, lessonPlans, loginLogs }));
            setIsSeeded(true);
            console.log(`✅ Seeded ${refreshedTeachers.length} teachers successfully`);
          } catch (seedError) {
            console.error("❌ Seeding failed:", seedError);
            setState(prev => ({ ...prev, teachers: [], lessonPlans, loginLogs }));
          }
        } else {
          setState(prev => ({ ...prev, teachers, lessonPlans, loginLogs }));
        }
      } else {
        setState(prev => ({ ...prev, teachers, lessonPlans, loginLogs }));
      }
      
      setLastSynced(new Date());
      setConnectionError('');
    } catch (error: any) {
      console.error("❌ Cloud Sync Error:", error);
      setConnectionError(`Sync failed: ${error.message}. Check internet connection.`);
      setState(prev => ({ ...prev, teachers: [], lessonPlans: [], loginLogs: [] }));
    } finally {
      setIsSyncing(false);
      setIsAuthenticating(false);
    }
  }, [state.currentUser, isSeeded]);

  // ✅ Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Initializing Sacred Heart Management Hub...");
        
        // Check online status first
        if (!navigator.onLine) {
          setConnectionError('No internet connection. Please check your network.');
          setIsAuthenticating(false);
          return;
        }
        
        // Check database seed status
        await checkIfSeeded();
        
        // Check for saved user
        const savedUser = localStorage.getItem('shs_user');
        if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log(`👤 Found saved user: ${parsedUser.email || 'admin'}`);
            setState(prev => ({ ...prev, currentUser: parsedUser }));
            await fetchData(parsedUser);
          } catch (parseError) {
            console.error("❌ Error parsing saved user:", parseError);
            localStorage.removeItem('shs_user');
            setIsAuthenticating(false);
          }
        } else {
          console.log("👤 No saved user found");
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error("❌ Initialization error:", error);
        setConnectionError('Initialization failed. Please refresh the page.');
        setIsAuthenticating(false);
      }
    };

    // Set timeout for authentication
    const timeoutId = setTimeout(() => {
      if (isAuthenticating) {
        console.log("⏰ Authentication timeout reached");
        setIsAuthenticating(false);
      }
    }, 10000);

    init();

    return () => clearTimeout(timeoutId);
  }, [fetchData, checkIfSeeded]);

  // ✅ Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setConnectionError('');
    setIsSyncing(true);
    
    try {
      // Check internet connection
      if (!isOnline) {
        setLoginError("No internet connection. Please check your network.");
        setIsSyncing(false);
        return;
      }

      if (loginMode === 'admin') {
        const { ADMIN_CREDENTIALS } = await import('./constants');
        if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
          const user = 'admin' as const;
          console.log("🔑 Admin login successful");
          setState(prev => ({ ...prev, currentUser: user }));
          localStorage.setItem('shs_user', JSON.stringify(user));
          
          await APIService.logLoginActivity({ email: 'admin', name: 'Administrator' });
          
          await fetchData(user);
          return;
        } else {
          setLoginError("Admin Access Denied. Invalid credentials.");
          return;
        }
      }

      // Teacher login
      console.log("🔍 Verifying teacher login...");
      const teachers = await APIService.fetchTeachers();
      console.log(`📊 Found ${teachers.length} teachers in database`);

      const normalizedEmail = loginEmail.toLowerCase().trim();
      
      // Debug: Log all teacher emails
      console.log("📧 All teacher emails:", teachers.map(t => t.email));
      
      const teacher = teachers.find(t => {
        const teacherEmail = t.email?.toLowerCase().trim();
        return teacherEmail === normalizedEmail;
      });
      
      console.log("🔎 Login search result:", { 
        searchedEmail: normalizedEmail,
        teacherFound: !!teacher,
        teacherName: teacher?.name,
        totalTeachers: teachers.length
      });

      if (!teacher) {
        setLoginError(`Teacher not found: ${normalizedEmail}. Please contact administrator.`);
        return;
      }

      // Check password
      const expectedPass = teacher.password || DEFAULT_TEACHER_PASSWORD;
      
      if (loginPassword === expectedPass) {
        console.log(`✅ Login successful for ${teacher.name}`);
        setState(prev => ({ ...prev, currentUser: teacher, teachers }));
        localStorage.setItem('shs_user', JSON.stringify(teacher));
        
        await APIService.logLoginActivity({ 
          email: teacher.email, 
          name: teacher.name 
        });
        
        await fetchData(teacher);
      } else {
        setLoginError(`Invalid password. Default password is: ${DEFAULT_TEACHER_PASSWORD}`);
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      if (err.message?.includes('Failed to fetch')) {
        setLoginError("Network error. Please check internet connection and try again.");
      } else if (err.message?.includes('Firestore')) {
        setLoginError("Database connection failed. Please try again in a moment.");
      } else {
        setLoginError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ Handle logout
  const handleLogout = () => {
    console.log("👋 Logging out...");
    setState({ currentUser: null, teachers: [], lessonPlans: [], loginLogs: [] });
    localStorage.removeItem('shs_user');
    setLastSynced(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setConnectionError('');
  };

  // ✅ Force refresh data
  const handleForceRefresh = async () => {
    setIsSyncing(true);
    try {
      await fetchData();
      console.log("🔄 Force refresh completed");
    } catch (error) {
      console.error("Force refresh failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading screen
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <GraduationCap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Initializing System</p>
            <div className="flex items-center justify-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  <span className="text-[8px] text-emerald-600 font-bold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-rose-500" />
                  <span className="text-[8px] text-rose-600 font-bold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login screen (no user logged in)
  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc]">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          {/* Connection Status Banner */}
          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
              <WifiOff className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-amber-800 text-xs font-bold">You are offline</p>
                <p className="text-amber-600 text-[10px]">Please check your internet connection</p>
              </div>
            </div>
          )}
          
          {connectionError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <div>
                <p className="text-rose-800 text-xs font-bold">Connection Error</p>
                <p className="text-rose-600 text-[10px]">{connectionError}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-indigo-100 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 mb-6">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-2">Sacred Heart</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Management Hub</p>
              
              {/* Database Status */}
              <div className="mt-4 flex items-center gap-2">
                <Database className={`h-4 w-4 ${isSeeded ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={`text-xs font-bold ${isSeeded ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isSeeded === null ? 'Checking...' : isSeeded ? 'Database Ready' : 'Database Not Seeded'}
                </span>
              </div>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button 
                onClick={() => {
                  setLoginMode('teacher');
                  setLoginError('');
                }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Teacher Login
              </button>
              <button 
                onClick={() => {
                  setLoginMode('admin');
                  setLoginError('');
                }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Admin Login
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input 
                  required
                  type="email"
                  placeholder="Official Email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm"
                  value={loginEmail}
                  onChange={e => {
                    setLoginEmail(e.target.value);
                    setLoginError('');
                  }}
                  disabled={!isOnline}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input 
                  required
                  type="password"
                  placeholder="Access Password"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm tracking-widest"
                  value={loginPassword}
                  onChange={e => {
                    setLoginPassword(e.target.value);
                    setLoginError('');
                  }}
                  disabled={!isOnline}
                />
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-rose-600 text-xs font-bold">{loginError}</p>
                  {loginError.includes('Default password') && (
                    <p className="text-rose-500 text-[10px] mt-1">Contact admin if you forgot your password</p>
                  )}
                </div>
              )}

              {/* Login Button */}
              <button 
                disabled={isSyncing || !isOnline}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="h-4 w-4" />
                    No Internet
                  </>
                ) : (
                  "Authorize Entry"
                )}
              </button>
            </form>

            {/* Emergency Seed Button (for admin when not seeded) */}
            {loginMode === 'admin' && isSeeded === false && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={handleManualSeed}
                  disabled={isSyncing || !isOnline}
                  className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {isSyncing ? 'Seeding Database...' : 'Click to Seed Database'}
                </button>
                <p className="text-[9px] text-slate-500 text-center mt-2">
                  Use this only if database is empty. This will add all teachers.
                </p>
              </div>
            )}

            {/* Status Footer */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-rose-500" />
                      <span className="text-rose-600 font-bold">Offline</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className={`h-3 w-3 ${isSeeded ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="font-bold">
                    {isSeeded === null ? '...' : isSeeded ? 'Cloud Sync ✓' : 'Not Seeded'}
                  </span>
                </div>
              </div>
              
              {/* Multi-device note */}
              <p className="text-[8px] text-slate-400 text-center mt-3">
                This system syncs across all devices. Changes made on one device appear on all.
              </p>
            </div>
          </div>

          {/* Debug Info (visible only in development) */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-[8px] text-slate-500">
                Project: lesson-plan-b4c8e | Teachers in DB: {state.teachers.length}
              </p>
              <button 
                onClick={() => console.log("Debug Info:", { 
                  teachers: state.teachers,
                  isSeeded, 
                  isOnline,
                  currentUser: state.currentUser 
                })}
                className="text-[8px] text-indigo-500 mt-1"
              >
                Show Debug Info
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main app layout (user is logged in)
  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={handleForceRefresh}
      isSyncing={isSyncing}
      lastSynced={lastSynced}
      isOnline={isOnline}
    >
      {/* Connection Status in Main App */}
      {!isOnline && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-amber-800 text-sm font-bold">Working Offline</p>
              <p className="text-amber-600 text-xs">Some features may be limited. Data will sync when back online.</p>
            </div>
          </div>
        </div>
      )}
      
      {state.currentUser === 'admin' ? (
        <div className="space-y-8">
          {/* Admin Tabs */}
          <div className="flex justify-center flex-wrap gap-2 print-hidden">
            {[
              { id: 'registry', label: 'Faculty Registry', icon: Users },
              { id: 'submissions', label: 'Submissions', icon: FileText },
              { id: 'defaulters', label: 'Defaulters', icon: AlertTriangle },
              { id: 'teacher-logins', label: 'Teacher Logins', icon: Clock },
              { id: 'compile', label: 'PDF Compilation', icon: Printer },
              { id: 'logins', label: 'All Logs', icon: Key }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'}`}
                disabled={!isOnline && tab.id !== 'registry'}
              >
                <tab.icon className="h-3.5 w-3.5" /> 
                {tab.label}
                {!isOnline && tab.id !== 'registry' && (
                  <span className="text-[6px] text-amber-500">(Offline)</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'registry' && (
              <AdminRegistry 
                teachers={state.teachers}
                lessonPlans={state.lessonPlans}
                onAddTeacher={async (t) => { 
                  await APIService.addTeacher(t); 
                  await fetchData(); 
                }}
                onUpdateTeacher={async (id, upd) => { 
                  await APIService.updateTeacher(id, upd); 
                  await fetchData(); 
                }}
                onRemoveTeacher={async (id) => { 
                  await APIService.removeTeacher(id); 
                  await fetchData(); 
                }}
                onRefresh={() => fetchData()}
                isOnline={isOnline}
              />
            )}
            
            {activeTab === 'submissions' && (
              <SubmissionHistory 
                lessonPlans={state.lessonPlans} 
                teachers={state.teachers} 
              />
            )}
            
            {activeTab === 'defaulters' && (
              <DefaultersList 
                teachers={state.teachers} 
                lessonPlans={state.lessonPlans} 
              />
            )}
            
            {activeTab === 'teacher-logins' && (
              <TeacherLoginHistory 
                loginLogs={state.loginLogs.filter(log => log.email !== 'admin')}
              />
            )}
            
            {activeTab === 'compile' && (
              <AdminCompiler 
                lessonPlans={state.lessonPlans} 
                teachers={state.teachers} 
              />
            )}
            
            {activeTab === 'logins' && (
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight">Recent Access Logs</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                      All login activities
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-slate-400">
                    Total: {state.loginLogs.length}
                  </div>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {state.loginLogs.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                      <Key className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">No login records found</p>
                    </div>
                  ) : (
                    state.loginLogs.slice(0, 50).map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${log.email === 'admin' ? 'bg-purple-50' : 'bg-indigo-50'}`}>
                            <User className={`h-4 w-4 ${log.email === 'admin' ? 'text-purple-600' : 'text-indigo-600'}`} />
                          </div>
                          <div>
                            <div className="text-[11px] font-black uppercase text-slate-800">{log.name}</div>
                            <div className="text-[9px] font-bold text-slate-500">{log.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[8px] text-slate-300 font-bold">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <TeacherForm 
          teacher={state.currentUser as Teacher} 
          history={state.lessonPlans.filter(p => p.teacherId === (state.currentUser as Teacher).email)} 
          onRefresh={() => fetchData()}
          isOnline={isOnline}
        />
      )}
    </Layout>
  );
};

export default App;
