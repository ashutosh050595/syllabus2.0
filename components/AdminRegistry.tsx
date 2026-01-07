import React, { useState, useEffect } from 'react';
import { 
  Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, Save, X, Plus, Eye, EyeOff, 
  Eye as EyeIcon, Database, FileText, AlertCircle, Download, Server,
  BookOpen, Clock, TrendingUp, BarChart, Calendar, ArrowUpRight,
  ArrowDownRight, Award, Sparkles
} from 'lucide-react';
import { useTeacherIdentity } from '../hooks/useTeacherIdentity';
import { Teacher, LessonPlan, Assignment, LoginLog } from '../types';
import { APIService } from '../services/api-supabase';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from '../constants';
import { getUpcomingMonday, formatDate } from '../utils';

interface AdminRegistryProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  loginLogs: LoginLog[];
  resubmissionRequests: any[];
  onAddTeacher: (teacher: Teacher) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  onRemoveTeacher: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isOnline: boolean;
}

const AdminRegistry: React.FC<AdminRegistryProps> = ({ 
  teachers, 
  lessonPlans,
  loginLogs,
  resubmissionRequests,
  onAddTeacher, 
  onUpdateTeacher, 
  onRemoveTeacher,
  onRefresh,
  isOnline
}) => {
  const { normalizeTeacher, getTeacherId } = useTeacherIdentity();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, 'sections'> & { sections: string }>({
    className: '10',
    subject: '',
    sections: ''
  });
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    phone: '',
    password: 'Teacher@2024',
    isClassTeacher: false,
    classTeacherOf: null,
    assignments: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
  const [showFirebaseData, setShowFirebaseData] = useState(false);
  const [firebaseTeachers, setFirebaseTeachers] = useState<Teacher[]>([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);

  // Dashboard Stats Calculations
  const upcomingMonday = getUpcomingMonday();
  const weekLabel = `${formatDate(upcomingMonday)} - ${formatDate(new Date(upcomingMonday.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
  
  const totalTeachers = teachers.length;
  const submittedThisWeek = new Set(
    lessonPlans
      .filter(plan => plan.weekStarting === upcomingMonday.toISOString())
      .map(plan => plan.teacherId)
  ).size;
  const defaultersCount = totalTeachers - submittedThisWeek;
  const submissionRate = totalTeachers > 0 ? (submittedThisWeek / totalTeachers * 100).toFixed(1) : '0';
  
  const todayLogins = loginLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;
  
  const pendingResubmissions = resubmissionRequests.length;
  
  const recentLogins = loginLogs.slice(0, 5);
  const recentSubmissions = lessonPlans
    .filter(plan => new Date(plan.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 5);

  useEffect(() => {
    if (editingTeacher) {
      setEditFormData({
        name: editingTeacher.name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        password: editingTeacher.password,
        isClassTeacher: editingTeacher.isClassTeacher,
        classTeacherOf: editingTeacher.classTeacherOf,
        assignments: [...editingTeacher.assignments]
      });
    }
  }, [editingTeacher]);

  const handleSeed = async () => {
    if (isSeeding) {
      console.log("Seed operation already in progress, ignoring duplicate call");
      return;
    }

    if (!confirm(
      `Seed cloud faculty registry with ${INITIAL_TEACHERS.length} local records?\n\nThis will add all initial teachers to the database.`
    )) {
      return;
    }

    setIsSeeding(true);

    try {
      const currentTeachers = await APIService.fetchTeachers();

      if (currentTeachers.length > 0) {
        const shouldOverwrite = confirm(
          `Database already contains ${currentTeachers.length} teachers. Do you want to overwrite with initial teachers?`
        );

        if (!shouldOverwrite) {
          setIsSeeding(false);
          return;
        }

        await APIService.clearTeachersCollection();
      }

      await APIService.syncInitialTeachers(INITIAL_TEACHERS);

      alert(`Success: ${INITIAL_TEACHERS.length} faculty members synchronized to cloud.`);
      await onRefresh();
      setShowSeedPreview(false);
    } catch (e) {
      console.error("Seed error:", e);
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleViewFirebaseData = async () => {
    setIsLoadingFirebase(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
      } else {
        alert("Firebase database is currently empty. Click 'Seed Database' to add initial teachers.");
      }
    } catch (error) {
      console.error("Error viewing Firebase data:", error);
      alert("Failed to fetch data from Firebase.");
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  const handleSmartSeed = async () => {
    if (isSeeding) return;
    
    setIsSeeding(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
        alert(`⚠️ Firebase already contains ${currentFirebaseTeachers.length} teachers. Showing current data instead.`);
      } else {
        await APIService.syncInitialTeachers(INITIAL_TEACHERS);
        const seededTeachers = await APIService.fetchTeachers();
        setFirebaseTeachers(seededTeachers);
        setShowFirebaseData(true);
        await onRefresh();
        alert(`✅ Successfully seeded ${INITIAL_TEACHERS.length} teachers to empty database`);
      }
    } catch (error) {
      console.error("Error in smart seed:", error);
      alert("Failed to process seed request.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSendWarnings = async () => {
    if (!confirm("Send automated email reminders to all teachers who haven't submitted plans for next week?")) return;
    setIsSendingAlerts(true);
    try {
      alert("Automated email reminders are currently disabled.");
    } catch (e) {
      alert("Failed to trigger warnings.");
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditing(true);
    setShowEditPassword(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher || !editFormData) return;
    
    try {
      const updates = { ...editFormData };
      
      if (!updates.password || updates.password.trim() === '') {
        updates.password = DEFAULT_TEACHER_PASSWORD;
      }
      
      await onUpdateTeacher(getTeacherId(editingTeacher.email), updates);
      setIsEditing(false);
      setEditingTeacher(null);
      setEditFormData({});
      await onRefresh();
      alert("Teacher information updated successfully!");
    } catch (error) {
      alert("Failed to update teacher. Please try again.");
    }
  };

  const handleAddAssignment = () => {
    if (!newAssignment.subject.trim() || !newAssignment.sections.trim()) {
      alert("Please enter both subject and sections.");
      return;
    }

    const sectionsArray = newAssignment.sections.split(',').map(s => s.trim()).filter(s => s);
    
    const assignment: Assignment = {
      className: newAssignment.className,
      subject: newAssignment.subject,
      sections: sectionsArray
    };

    setEditFormData(prev => ({
      ...prev,
      assignments: [...(prev.assignments || []), assignment]
    }));

    setNewAssignment({
      className: '10',
      subject: '',
      sections: ''
    });
  };

  const handleRemoveAssignment = (index: number) => {
    if (!editFormData.assignments) return;
    
    const updatedAssignments = [...editFormData.assignments];
    updatedAssignments.splice(index, 1);
    
    setEditFormData(prev => ({
      ...prev,
      assignments: updatedAssignments
    }));
  };

  const handleAddNewTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert("Please enter both name and email.");
      return;
    }

    const teacherData: Teacher = normalizeTeacher({
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone || '',
      password: newTeacher.password || DEFAULT_TEACHER_PASSWORD,
      isClassTeacher: newTeacher.isClassTeacher || false,
      classTeacherOf: newTeacher.classTeacherOf || null,
      assignments: newTeacher.assignments || []
    });

    try {
      await onAddTeacher(teacherData);
      await onRefresh();
      setShowAddTeacher(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        password: DEFAULT_TEACHER_PASSWORD,
        isClassTeacher: false,
        classTeacherOf: null,
        assignments: []
      });
      alert("Teacher added successfully!");
    } catch (error) {
      alert("Failed to add teacher. Please try again.");
    }
  };

  // Fix for Teacher/Admin tab click issue
  const handleTabClick = (mode: 'teacher' | 'admin') => {
    if (!isOnline) return;
    // Your tab switching logic here
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-2">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onRefresh()}
            className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
          >
            <RefreshCw className="h-5 w-5 text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-bold">Last Updated</div>
            <div className="text-sm font-black text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{totalTeachers}</div>
          <div className="text-sm font-bold text-indigo-300">Total Faculty</div>
          <div className="text-xs text-gray-400 mt-2">Active teaching staff</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-emerald-400 text-sm font-black bg-emerald-500/20 px-2 py-1 rounded-lg">
              {submissionRate}%
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-2">{submittedThisWeek}</div>
          <div className="text-sm font-bold text-emerald-300">Submitted This Week</div>
          <div className="text-xs text-gray-400 mt-2">Week: {weekLabel}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <ArrowDownRight className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{defaultersCount}</div>
          <div className="text-sm font-bold text-amber-300">Pending Submissions</div>
          <div className="text-xs text-gray-400 mt-2">Reminders scheduled</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-purple-400 text-sm font-black bg-purple-500/20 px-2 py-1 rounded-lg">
              Today
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-2">{todayLogins}</div>
          <div className="text-sm font-bold text-purple-300">Today's Logins</div>
          <div className="text-xs text-gray-400 mt-2">Active users</div>
        </div>
      </div>

      {/* Faculty Registry Section */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
        {/* Header Section with New Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Faculty Registry
            </h3>
            <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
              {teachers.length} teachers in database
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddTeacher(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Teacher
            </button>
            <button 
              onClick={() => onRefresh()}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            
            <button 
              onClick={handleViewFirebaseData}
              disabled={isLoadingFirebase}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isLoadingFirebase ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Server className="h-4 w-4" />
              )}
              {isLoadingFirebase ? 'Loading...' : 'View Cloud Data'}
            </button>
            
            <button 
              onClick={handleSmartSeed}
              disabled={isSeeding}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-violet-700 transition-all disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isSeeding ? 'Processing...' : 'Smart Seed'}
            </button>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-3xl">
              <div className="flex flex-col items-center">
                <Database className="h-16 w-16 text-blue-400 mb-4" />
                <p className="text-white font-black text-lg mb-2">📊 Database Status</p>
                <p className="text-gray-400 mb-6 max-w-md">
                  Local state shows no teachers. Check cloud database for actual data or seed the database.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => setShowAddTeacher(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Teacher
                  </button>
                  <button 
                    onClick={handleViewFirebaseData}
                    disabled={isLoadingFirebase}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingFirebase ? (
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                    ) : (
                      <Server className="h-4 w-4 inline mr-2" />
                    )}
                    {isLoadingFirebase ? 'Loading...' : 'Check Cloud'}
                  </button>
                  <button 
                    onClick={handleSmartSeed}
                    disabled={isSeeding}
                    className="px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 inline mr-2" />
                    )}
                    {isSeeding ? 'Processing...' : 'Smart Seed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Faculty Member</th>
                  <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Assignments</th>
                  <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Status</th>
                  <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Password</th>
                  <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="group hover:bg-gray-800/50 transition-colors">
                    <td className="py-5 px-4">
                      <div className="font-black text-white italic">{teacher.name}</div>
                      <div className="text-xs text-gray-400 font-bold">{teacher.email}</div>
                      <div className="text-xs text-gray-500 font-bold">{teacher.phone}</div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignments.map((asgn, idx) => (
                          <span key={idx} className="text-xs font-black bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded-lg uppercase">
                            {asgn.subject} ({asgn.className})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      {teacher.isClassTeacher ? (
                        <span className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-lg uppercase">
                          CT {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}
                        </span>
                      ) : (
                        <span className="text-xs font-black bg-gray-700 text-gray-300 px-3 py-1 rounded-lg uppercase">Faculty</span>
                      )}
                    </td>
                    <td className="py-5 px-4">
                      <div className="text-xs font-bold text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg">
                        {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(teacher)}
                          className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors hover:bg-gray-800"
                          title="Edit teacher"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onRemoveTeacher(teacher.id)}
                          className="p-2 text-gray-400 hover:text-rose-400 rounded-lg transition-colors hover:bg-gray-800"
                          title="Remove teacher"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg font-black text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {recentLogins.map((log, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-xl">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white truncate">{log.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </div>
          ))}
          
          {recentSubmissions.map((plan, idx) => (
            <div key={`sub-${idx}`} className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-xl">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white truncate">{plan.subject}</div>
                <div className="text-xs text-gray-400">
                  {plan.className}-{plan.section} • {plan.teacherId.split('@')[0]}
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg font-black text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Send Reminders</div>
                <div className="text-xs text-gray-400">To defaulters</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <BarChart className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Generate Reports</div>
                <div className="text-xs text-gray-400">Weekly compilation</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Review Requests</div>
                <div className="text-xs text-gray-400">Pending approvals</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Schedule Tasks</div>
                <div className="text-xs text-gray-400">Automate processes</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Add New Teacher</h3>
              <button onClick={() => setShowAddTeacher(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Email</label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="teacher@school.edu"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddNewTeacher}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700"
                >
                  Add Teacher
                </button>
                <button
                  onClick={() => setShowAddTeacher(false)}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditing && editingTeacher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Edit Teacher: {editingTeacher.name}</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Data Preview Modal */}
      {showFirebaseData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-6xl w-full border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Server className="h-6 w-6 text-blue-400" />
                  Cloud Database Data
                </h3>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">
                  {firebaseTeachers.length} teachers in cloud database
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onRefresh()}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600/30 flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Faculty Member</th>
                    <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Assignments</th>
                    <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Status</th>
                    <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4">Password</th>
                    <th className="pb-4 text-xs font-black uppercase text-gray-400 tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {firebaseTeachers.map(teacher => (
                    <tr key={teacher.id} className="group hover:bg-gray-800/50 transition-colors">
                      <td className="py-5 px-4">
                        <div className="font-black text-white italic">{teacher.name}</div>
                        <div className="text-xs text-gray-400 font-bold">{teacher.email}</div>
                        <div className="text-xs text-gray-500 font-bold">{teacher.phone}</div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignments.map((asgn, idx) => (
                            <span key={idx} className="text-xs font-black bg-blue-500/10 text-blue-300 px-2 py-1 rounded-lg uppercase">
                              {asgn.subject} ({asgn.className})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        {teacher.isClassTeacher ? (
                          <span className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-lg uppercase">
                            CT {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}
                          </span>
                        ) : (
                          <span className="text-xs font-black bg-gray-700 text-gray-300 px-3 py-1 rounded-lg uppercase">Faculty</span>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="text-xs font-bold text-gray-300 bg-gray-900/50 px-3 py-2 rounded-lg">
                          {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setIsEditing(true);
                              setShowFirebaseData(false);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors hover:bg-gray-800"
                            title="Edit teacher"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Remove ${teacher.name} from database?`)) {
                                onRemoveTeacher(getTeacherId(teacher.email)).then(() => {
                                  setFirebaseTeachers(prev => prev.filter(t => t.id !== teacher.id));
                                  onRefresh();
                                });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-rose-400 rounded-lg transition-colors hover:bg-gray-800"
                            title="Remove teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
              <p className="text-xs text-blue-400">
                Live data from cloud database • Last fetched: {new Date().toLocaleTimeString()}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistry;
