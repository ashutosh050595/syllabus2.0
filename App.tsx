import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, AlertCircle, Users, Printer, History, Key, 
  ShieldCheck, X, CheckCircle2, RefreshCw, Lock, Mail, 
  GraduationCap, FileText, User, Clock, AlertTriangle,
  Database, Wifi, WifiOff, Cloud, CloudOff, Sparkles,
  BookOpen, Bell, Settings, BarChart, Calendar,
  ChevronRight, Shield, Rocket, Star, Award,
  Eye, EyeOff // Added missing imports
} from 'lucide-react';
import { AppState, LessonPlan, Teacher } from './types';
import { APIService } from './services/api-supabase';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from './constants';
import Layout from './components/Layout';
import { normalizeEmail } from "./utils/identity";
import AdminRegistry from './components/AdminRegistry';
import AdminCompiler from './components/AdminCompiler';
import TeacherForm from './components/TeacherForm';
import SubmissionHistory from './components/SubmissionHistory';
import DefaultersList from './components/DefaultersList';
import TeacherLoginHistory from './components/TeacherLoginHistory';
import ResubmissionRequests from './components/ResubmissionRequests';
import DashboardStats from './components/DashboardStats';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ 
    currentUser: null, 
    teachers: [], 
    lessonPlans: [], 
    loginLogs: [],
    resubmissionRequests: []
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'submissions' | 'defaulters' | 'teacher-logins' | 'compile' | 'logins' | 'resubmissions'>('dashboard');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSeeded, setIsSeeded] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string>('');
  const [databaseStatus, setDatabaseStatus] = useState<{ seeded: boolean; teacherCount: number }>({ seeded: false, teacherCount: 0 });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear email when switching tabs
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  }, [loginMode]);

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

  const checkDatabaseStatus = useCallback(async () => {
    try {
      console.log("🔍 Checking database status...");
      const status = await APIService.getDatabaseStatus();
      setDatabaseStatus(status);
      setIsSeeded(status.seeded);
      console.log(`📊 Database: ${status.seeded ? 'Seeded' : 'Not Seeded'} (${status.teacherCount} teachers)`);
      return status;
    } catch (error) {
      console.error("Error checking database:", error);
      const status = { seeded: false, teacherCount: 0 };
      setDatabaseStatus(status);
      setIsSeeded(false);
      setConnectionError('Cannot connect to database. Check internet connection.');
      return status;
    }
  }, []);

  const handleManualSeed = async () => {
    try {
      setIsSyncing(true);
      setLoginError('');
      console.log("🌱 Starting manual database seed...");
      
      const status = await checkDatabaseStatus();
      if (status.seeded && status.teacherCount > 0) {
        setLoginError(`Database already has ${status.teacherCount} teachers.`);
        setIsSyncing(false);
        return;
      }
      
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      console.log("✅ Database seeded successfully!");
      
      await checkDatabaseStatus();
      setLoginError("✅ Database seeded successfully! Try logging in now.");
      setTimeout(() => setLoginError(''), 3000);
    } catch (error: any) {
      console.error("Manual seed failed:", error);
      setLoginError(`Seed failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = useCallback(async (userOverride?: any) => {
    const user = userOverride || state.currentUser;
    if (!user) {
      setIsAuthenticating(false);
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log("📡 Fetching data from Supabase...");
      
      const [teachers, lessonPlans, loginLogs, resubmissionRequests] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans(),
        user === 'admin' ? APIService.fetchLoginLogs() : Promise.resolve([]),
        user === 'admin' ? APIService.getPendingResubmissions() : Promise.resolve([])
      ]);
      
      console.log(`✅ Fetched: ${teachers.length} teachers, ${lessonPlans.length} lesson plans`);
      
      setState(prev => ({ 
        ...prev, 
        teachers, 
        lessonPlans, 
        loginLogs,
        resubmissionRequests 
      }));
      await checkDatabaseStatus();
      
      setLastSynced(new Date());
      setConnectionError('');
    } catch (error: any) {
      console.error("Data fetch error:", error);
      setConnectionError(`Sync failed: ${error.message}`);
      setState(prev => ({ 
        ...prev, 
        teachers: [], 
        lessonPlans: [], 
        loginLogs: [],
        resubmissionRequests: [] 
      }));
    } finally {
      setIsSyncing(false);
      setIsAuthenticating(false);
    }
  }, [state.currentUser, checkDatabaseStatus]);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Initializing Sacred Heart Management Hub...");
        
        if (!navigator.onLine) {
          setConnectionError('No internet connection.');
          setIsAuthenticating(false);
          return;
        }
        
        await checkDatabaseStatus();
        
        const savedUser = localStorage.getItem('shs_user');
        if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log(`👤 Found saved user: ${parsedUser.email || 'admin'}`);
            setState(prev => ({ ...prev, currentUser: parsedUser }));
            await fetchData(parsedUser);
          } catch (parseError) {
            console.error("Error parsing saved user:", parseError);
            localStorage.removeItem('shs_user');
            setIsAuthenticating(false);
          }
        } else {
          console.log("👤 No saved user found");
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setConnectionError('Initialization failed. Please refresh.');
        setIsAuthenticating(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isAuthenticating) {
        console.log("Authentication timeout reached");
        setIsAuthenticating(false);
      }
    }, 10000);

    init();

    return () => clearTimeout(timeoutId);
  }, [fetchData, checkDatabaseStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setConnectionError('');
    setIsSyncing(true);
    
    try {
      if (!isOnline) {
        setLoginError("No internet connection. Please check your network.");
        setIsSyncing(false);
        return;
      }

      console.log(`🔑 Login attempt: ${loginEmail}, Mode: ${loginMode}`);

      if (loginMode === 'admin') {
        const { ADMIN_CREDENTIALS } = await import('./constants');
        if (loginEmail === ADMIN_CREDENTIALS.id && loginPassword === ADMIN_CREDENTIALS.password) {
          const user = 'admin' as const;
          console.log("✅ Admin login successful");
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

      console.log("🔍 Verifying teacher credentials...");
      const normalizedEmail = normalizeEmail(loginEmail);
      
      const teacher = await APIService.getTeacherByEmail(normalizedEmail);
      
      console.log("🔎 Teacher lookup result:", { 
        searchedEmail: normalizedEmail,
        teacherFound: !!teacher,
        teacherName: teacher?.name
      });

      if (!teacher) {
        const allTeachers = await APIService.fetchTeachers();
        console.log(`📊 Total teachers in database: ${allTeachers.length}`);
        
        const foundTeacher = allTeachers.find(t => 
          normalizeEmail(t.email) === normalizedEmail
        );
        
        if (!foundTeacher) {
          setLoginError(`Teacher not found: ${normalizedEmail}. Please contact administrator.`);
          return;
        }
        
        const expectedPass = foundTeacher.password || DEFAULT_TEACHER_PASSWORD;
        
        if (loginPassword === expectedPass) {
          console.log(`✅ Login successful for ${foundTeacher.name}`);
          setState(prev => ({ ...prev, currentUser: foundTeacher, teachers: allTeachers }));
          localStorage.setItem('shs_user', JSON.stringify(foundTeacher));
          
          await APIService.logLoginActivity({ 
            email: foundTeacher.email, 
            name: foundTeacher.name 
          });
          await fetchData(foundTeacher);
        } else {
          setLoginError(`Invalid password. Default password is: ${DEFAULT_TEACHER_PASSWORD}`);
        }
      } else {
        const expectedPass = teacher.password || DEFAULT_TEACHER_PASSWORD;
        
        if (loginPassword === expectedPass) {
          console.log(`✅ Login successful for ${teacher.name}`);
          setState(prev => ({ ...prev, currentUser: teacher }));
          localStorage.setItem('shs_user', JSON.stringify(teacher));
          
          await APIService.logLoginActivity({ 
            email: teacher.email, 
            name: teacher.name 
          });
          await fetchData(teacher);
        } else {
          setLoginError(`Invalid password. Default password is: ${DEFAULT_TEACHER_PASSWORD}`);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Network')) {
        setLoginError("Network error. Please check internet connection.");
      } else if (err.message?.includes('database')) {
        setLoginError("Database connection failed. Please try again.");
      } else {
        setLoginError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    console.log("👋 Logging out...");
    setState({ currentUser: null, teachers: [], lessonPlans: [], loginLogs: [], resubmissionRequests: [] });
    localStorage.removeItem('shs_user');
    setLastSynced(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setConnectionError('');
  };

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

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="h-24 w-24 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
              <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
              <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600/80">Initializing Portal</p>
            <div className="flex items-center justify-center gap-2">
              {isOnline ? (
                <>
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-bold">Connected</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-rose-600 font-bold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    // Fixed SVG data URL - removed quote escaping issues
    const gridPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid pattern overlay - FIXED */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: gridPattern }}
        ></div>

        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative z-10">
          {!isOnline && (
            <div className="mb-6 p-4 bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl flex items-center gap-3 animate-shake">
              <WifiOff className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-amber-200 text-sm font-bold">You are offline</p>
                <p className="text-amber-400/80 text-xs">Please check your internet connection</p>
              </div>
            </div>
          )}
          
          {connectionError && (
            <div className="mb-6 p-4 bg-rose-500/10 backdrop-blur-sm border border-rose-500/30 rounded-2xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <div>
                <p className="text-rose-200 text-sm font-bold">Connection Error</p>
                <p className="text-rose-400/80 text-xs">{connectionError}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/30 border border-gray-700/50 relative overflow-hidden">
            {/* Glowing border */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl"></div>
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="flex flex-col items-center mb-10 text-center relative z-10">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl shadow-2xl">
                  <ShieldCheck className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black italic bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent mb-2">
                Sacred Heart
              </h1>
              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Academic Portal</p>
              
              <div className="flex items-center gap-3 bg-gray-900/50 rounded-xl px-4 py-2 border border-gray-700">
                <Database className={`h-4 w-4 ${databaseStatus.seeded ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className={`text-xs font-bold ${databaseStatus.seeded ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {databaseStatus.seeded ? `Ready (${databaseStatus.teacherCount} teachers)` : 'Database Not Seeded'}
                </span>
                <Sparkles className="h-3 w-3 text-purple-400" />
              </div>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex bg-gray-900/50 p-1.5 rounded-2xl mb-8 border border-gray-700">
              <button 
                onClick={() => {
                  setLoginMode('teacher');
                  setLoginError('');
                }}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${loginMode === 'teacher' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  Teacher
                </div>
              </button>
              <button 
                onClick={() => {
                  setLoginMode('admin');
                  setLoginError('');
                }}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${loginMode === 'admin' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </div>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    required
                    type="email"
                    placeholder="Official Email"
                    className="w-full pl-11 pr-4 py-4 bg-gray-900/70 border border-gray-700 rounded-2xl font-bold text-white placeholder-gray-400 outline-none focus:border-indigo-500 transition-all duration-300 text-sm backdrop-blur-sm"
                    value={loginEmail}
                    onChange={e => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                    disabled={!isOnline}
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Access Password"
                    className="w-full pl-11 pr-12 py-4 bg-gray-900/70 border border-gray-700 rounded-2xl font-bold text-white placeholder-gray-400 outline-none focus:border-indigo-500 transition-all duration-300 text-sm tracking-widest backdrop-blur-sm"
                    value={loginPassword}
                    onChange={e => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    disabled={!isOnline}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-200 text-sm font-bold">{loginError}</p>
                      {loginError.includes('Default password') && (
                        <p className="text-rose-400/80 text-xs mt-1">Contact admin if you forgot your password</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <button 
                  disabled={isSyncing || !isOnline}
                  className="relative w-full bg-gradient-to-r from-indigo-700 to-purple-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin inline mr-2" />
                        Authenticating...
                      </>
                    ) : !isOnline ? (
                      <>
                        <WifiOff className="h-5 w-5 inline mr-2" />
                        No Internet
                      </>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5 inline mr-2" />
                        Authorize Entry
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {loginMode === 'admin' && databaseStatus.teacherCount === 0 && (
              <div className="mt-8 pt-8 border-t border-gray-700/50">
                <button 
                  onClick={handleManualSeed}
                  disabled={isSyncing || !isOnline}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:from-amber-500 hover:to-orange-500 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 group relative"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                    ) : (
                      <Database className="h-4 w-4 inline mr-2" />
                    )}
                    {isSyncing ? 'Seeding Database...' : 'Click to Seed Database'}
                  </span>
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Use this only if database is empty. This will add {INITIAL_TEACHERS.length} teachers.
                </p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-300 font-bold">Online</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-rose-400 rounded-full animate-pulse"></div>
                      <span className="text-rose-300 font-bold">Offline</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className={`h-4 w-4 ${databaseStatus.seeded ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="font-bold">
                    {databaseStatus.seeded ? 'Cloud Sync ✓' : 'Not Seeded'}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Powered by Supabase • Secure Cloud Database • Real-time Sync
              </p>
            </div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute -z-10 inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-indigo-500/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={state.currentUser} 
      onLogout={handleLogout}
      onRefresh={handleForceRefresh}
      isSyncing={isSyncing}
      lastSynced={lastSynced}
      isOnline={isOnline}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {!isOnline && (
        <div className="mb-6 p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <WifiOff className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-amber-100 text-sm font-bold">Working in Offline Mode</p>
              <p className="text-amber-300/80 text-xs">Some features may be limited. Data will sync automatically when back online.</p>
            </div>
          </div>
        </div>
      )}
      
      {state.currentUser === 'admin' ? (
        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <DashboardStats 
              teachers={state.teachers}
              lessonPlans={state.lessonPlans}
              loginLogs={state.loginLogs}
              resubmissionRequests={state.resubmissionRequests}
              onRefresh={handleForceRefresh}
            />
          )}
          
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
          
          {activeTab === 'resubmissions' && (
            <ResubmissionRequests 
              requests={state.resubmissionRequests}
              onApprove={async (requestId) => {
                await APIService.approveResubmission(requestId);
                await fetchData();
              }}
              onDecline={async (requestId, reason) => {
                await APIService.declineResubmission(requestId, reason);
                await fetchData();
              }}
            />
          )}
          
          {activeTab === 'logins' && (
            <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Recent Access Logs</h3>
                  <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
                    All login activities
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-gray-400 bg-gray-900/50 px-4 py-2 rounded-xl">
                    Total: {state.loginLogs.length}
                  </div>
                  <button 
                    onClick={handleForceRefresh}
                    className="p-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-300" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {state.loginLogs.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
                    <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-sm">No login records found</p>
                    <p className="text-gray-500 text-xs mt-1">Login activities will appear here</p>
                  </div>
                ) : (
                  state.loginLogs.slice(0, 50).map((log, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-900/30 rounded-2xl border border-gray-700/50 hover:bg-gray-800/50 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${log.email === 'admin' ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20' : 'bg-gradient-to-br from-indigo-600/20 to-blue-600/20'} group-hover:scale-105 transition-transform duration-300`}>
                          <User className={`h-5 w-5 ${log.email === 'admin' ? 'text-purple-400' : 'text-indigo-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white">{log.name}</div>
                          <div className="text-xs font-bold text-gray-400">{log.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-300">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
