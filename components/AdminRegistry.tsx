import React, { useState, useEffect } from 'react';
import { 
  Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, Save, X, Plus, Eye, EyeOff, 
  Eye as EyeIcon, Database, FileText, AlertCircle, Download, Server,
  BookOpen, Clock, TrendingUp, BarChart, Calendar, ArrowUpRight,
  ArrowDownRight, Award, Sparkles, Printer, Share2, FileDown,
  Search, Filter, ExternalLink, ChevronDown, ChevronUp,
  MessageSquare, Send, Bell, Shield, Lock, Unlock,
  GraduationCap, Book, DownloadCloud, UploadCloud,
  CheckCircle, XCircle, Clock as ClockIcon, Star
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
  const [selectedTeacherForLessonPlans, setSelectedTeacherForLessonPlans] = useState<Teacher | null>(null);
  const [showLessonPlanPreview, setShowLessonPlanPreview] = useState(false);
  const [showDefaulterEmailModal, setShowDefaulterEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<string>('');
  const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);

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

  // Filter teachers based on search and class
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || 
                         teacher.assignments.some(a => a.className === filterClass);
    return matchesSearch && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(teachers.flatMap(t => t.assignments.map(a => a.className)))).sort();

  // Get teacher's lesson plans
  const getTeacherLessonPlans = (teacherEmail: string) => {
    return lessonPlans.filter(plan => plan.teacherId === teacherEmail);
  };

  // Toggle teacher expansion
  const toggleTeacherExpansion = (teacherId: string) => {
    if (expandedTeachers.includes(teacherId)) {
      setExpandedTeachers(expandedTeachers.filter(id => id !== teacherId));
    } else {
      setExpandedTeachers([...expandedTeachers, teacherId]);
    }
  };

  // Download lesson plans as TEXT (simplified version without xlsx)
  const downloadLessonPlansAsText = (teacher: Teacher) => {
    const teacherPlans = getTeacherLessonPlans(teacher.email);
    if (teacherPlans.length === 0) {
      alert('No lesson plans found for this teacher');
      return;
    }

    let textContent = `Lesson Plans - ${teacher.name}\n`;
    textContent += `Email: ${teacher.email}\n`;
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    textContent += '='.repeat(50) + '\n\n';

    teacherPlans.forEach((plan, index) => {
      textContent += `PLAN #${index + 1}\n`;
      textContent += `Subject: ${plan.subject}\n`;
      textContent += `Class: ${plan.className}-${plan.section}\n`;
      textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      textContent += `Topics: ${plan.topics.join(', ')}\n`;
      textContent += `Objectives: ${plan.objectives}\n`;
      textContent += `Homework: ${plan.homework}\n`;
      textContent += '-'.repeat(40) + '\n\n';
    });

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LessonPlans_${teacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share lesson plans via email (using window.location for mailto)
  const shareLessonPlansViaEmail = (teacher: Teacher) => {
    const teacherPlans = getTeacherLessonPlans(teacher.email);
    if (teacherPlans.length === 0) {
      alert('No lesson plans found for this teacher');
      return;
    }

    const subject = `Lesson Plans - ${teacher.name}`;
    let body = `Dear ${teacher.name},\n\n`;
    body += `Here are your lesson plans:\n\n`;
    
    teacherPlans.forEach((plan, index) => {
      body += `Plan #${index + 1}:\n`;
      body += `Subject: ${plan.subject}\n`;
      body += `Class: ${plan.className}-${plan.section}\n`;
      body += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      body += `Topics: ${plan.topics.join(', ')}\n`;
      body += `Objectives: ${plan.objectives}\n`;
      body += `Homework: ${plan.homework}\n\n`;
    });

    body += `\nBest regards,\nSacred Heart School Administration`;

    const mailtoLink = `mailto:${teacher.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  // Send email to defaulters
  const sendEmailToDefaulters = async () => {
    const defaulters = teachers.filter(teacher => {
      const hasSubmitted = lessonPlans.some(plan => 
        plan.teacherId === teacher.email && 
        plan.weekStarting === upcomingMonday.toISOString()
      );
      return !hasSubmitted;
    });

    if (defaulters.length === 0) {
      alert('No defaulters found for this week!');
      return;
    }

    setSelectedDefaulters(defaulters.map(d => d.email));
    setEmailTemplate(`Dear Teacher,

This is a reminder that your lesson plan for the week of ${weekLabel} is pending.

Please submit your lesson plan at your earliest convenience.

Best regards,
Sacred Heart School Administration`);
    setShowDefaulterEmailModal(true);
  };

  // Send email using mailto fallback
  const sendBulkEmails = async () => {
    if (!isOnline) {
      alert('Cannot send emails while offline');
      return;
    }

    if (selectedDefaulters.length === 0) {
      alert('No recipients selected');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Get teacher details for selected emails
      const recipients = teachers
        .filter(teacher => selectedDefaulters.includes(teacher.email))
        .map(teacher => ({
          email: teacher.email,
          name: teacher.name
        }));

      // If only one recipient, open mailto directly
      if (recipients.length === 1) {
        const recipient = recipients[0];
        const mailtoLink = `mailto:${recipient.email}?subject=Reminder: Pending Lesson Plan Submission&body=${encodeURIComponent(emailTemplate)}`;
        window.open(mailtoLink, '_blank');
      } else {
        // For multiple recipients, create individual mailto links
        alert(`Preparing ${recipients.length} email(s). You will need to send them individually.`);
        
        // Create first email
        const firstRecipient = recipients[0];
        const mailtoLink = `mailto:${firstRecipient.email}?subject=Reminder: Pending Lesson Plan Submission&body=${encodeURIComponent(emailTemplate)}`;
        window.open(mailtoLink, '_blank');
      }
      
      setShowDefaulterEmailModal(false);
      setSelectedDefaulters([]);
      setEmailTemplate('');
      
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Preview teacher lesson plans
  const previewTeacherLessonPlans = (teacher: Teacher) => {
    setSelectedTeacherForLessonPlans(teacher);
    setShowLessonPlanPreview(true);
  };

  // Download all lesson plans for a class as TEXT
  const downloadClassLessonPlans = (className: string) => {
    const classPlans = lessonPlans.filter(plan => plan.className === className);
    if (classPlans.length === 0) {
      alert(`No lesson plans found for Class ${className}`);
      return;
    }

    let textContent = `Class ${className} Lesson Plans\n`;
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    textContent += '='.repeat(50) + '\n\n';

    classPlans.forEach((plan, index) => {
      const teacher = teachers.find(t => t.email === plan.teacherId);
      textContent += `PLAN #${index + 1}\n`;
      textContent += `Teacher: ${teacher?.name || plan.teacherId}\n`;
      textContent += `Subject: ${plan.subject}\n`;
      textContent += `Class: ${plan.className}-${plan.section}\n`;
      textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      textContent += `Topics: ${plan.topics.join(', ')}\n`;
      textContent += `Objectives: ${plan.objectives}\n`;
      textContent += `Homework: ${plan.homework}\n`;
      textContent += `Submitted: ${new Date(plan.submittedAt).toLocaleDateString()}\n`;
      textContent += '-'.repeat(40) + '\n\n';
    });

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_${className}_Lesson_Plans_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get class-wise statistics
  const getClassWiseStats = () => {
    const stats: Record<string, { total: number; submitted: number }> = {};
    
    teachers.forEach(teacher => {
      teacher.assignments.forEach(assignment => {
        const className = assignment.className;
        if (!stats[className]) {
          stats[className] = { total: 0, submitted: 0 };
        }
        stats[className].total += assignment.sections.length;
      });
    });

    lessonPlans.forEach(plan => {
      const className = plan.className;
      if (stats[className]) {
        stats[className].submitted += 1;
      }
    });

    return stats;
  };

  const classStats = getClassWiseStats();

  // Rest of your existing functions (handleSeed, handleViewFirebaseData, etc.)
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

      {/* Class-wise Stats and Actions */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-white">Class-wise Lesson Plans</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-900/70 border border-gray-700 rounded-xl text-white text-sm"
              />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 bg-gray-900/70 border border-gray-700 rounded-xl text-white text-sm"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(classStats).map(([className, stat]) => (
            <div key={className} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-black text-white">Class {className}</span>
                <span className={`text-xs font-black px-2 py-1 rounded ${stat.submitted >= stat.total ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {stat.submitted}/{stat.total}
                </span>
              </div>
              <button
                onClick={() => downloadClassLessonPlans(className)}
                className="w-full mt-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 text-xs font-black rounded-lg hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-3 w-3" />
                Download Plans
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Faculty Registry Section */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
        {/* Header Section with New Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Faculty Registry & Lesson Plans
            </h3>
            <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
              {teachers.length} teachers • {lessonPlans.length} lesson plans
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
              onClick={sendEmailToDefaulters}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-700 transition-all"
            >
              <Mail className="h-4 w-4" />
              Email Defaulters
            </button>
            <button 
              onClick={() => onRefresh()}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-3xl">
            <Database className="h-16 w-16 text-blue-400 mb-4" />
            <p className="text-white font-black text-lg mb-2">No teachers found</p>
            <p className="text-gray-400 mb-6 max-w-md">
              {searchTerm ? 'Try a different search term' : 'Add teachers to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeachers.map(teacher => {
              const teacherPlans = getTeacherLessonPlans(teacher.email);
              const isExpanded = expandedTeachers.includes(teacher.id);
              const hasSubmittedThisWeek = teacherPlans.some(plan => 
                plan.weekStarting === upcomingMonday.toISOString()
              );

              return (
                <div key={teacher.id} className="bg-gray-900/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                  {/* Teacher Header */}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${hasSubmittedThisWeek ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                            <User className={`h-5 w-5 ${hasSubmittedThisWeek ? 'text-emerald-400' : 'text-amber-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-black text-white italic">{teacher.name}</h4>
                              {hasSubmittedThisWeek ? (
                                <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">Submitted</span>
                              ) : (
                                <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">Pending</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 font-bold">{teacher.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {teacher.assignments.map((asgn, idx) => (
                                <span key={idx} className="text-xs font-black bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded-lg">
                                  {asgn.subject} (Class {asgn.className})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTeacherExpansion(teacher.id)}
                          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => previewTeacherLessonPlans(teacher)}
                          className="p-2 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/10"
                          title="Preview Lesson Plans"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadLessonPlansAsText(teacher)}
                          className="p-2 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/10"
                          title="Download as Text"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => shareLessonPlansViaEmail(teacher)}
                          className="p-2 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10"
                          title="Email Lesson Plans"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(teacher)}
                          className="p-2 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10"
                          title="Edit Teacher"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemoveTeacher(teacher.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                          title="Remove Teacher"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-700/50 bg-gray-900/50 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-black text-gray-300 mb-3">Lesson Plans ({teacherPlans.length})</h5>
                          {teacherPlans.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {teacherPlans.map((plan, idx) => (
                                <div key={idx} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white">{plan.subject}</span>
                                    <span className="text-xs font-black bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                      Class {plan.className}-{plan.section}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mb-2">
                                    Week: {new Date(plan.weekStarting).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-gray-300 line-clamp-2">{plan.topics.join(', ')}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No lesson plans submitted yet</p>
                          )}
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-black text-gray-300 mb-3">Quick Actions</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => previewTeacherLessonPlans(teacher)}
                              className="p-3 bg-blue-500/10 text-blue-300 rounded-xl hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="text-xs font-bold">Preview</span>
                            </button>
                            <button
                              onClick={() => downloadLessonPlansAsText(teacher)}
                              className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              <span className="text-xs font-bold">Download</span>
                            </button>
                            <button
                              onClick={() => shareLessonPlansViaEmail(teacher)}
                              className="p-3 bg-amber-500/10 text-amber-300 rounded-xl hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <Send className="h-4 w-4" />
                              <span className="text-xs font-bold">Email</span>
                            </button>
                            <button
                              onClick={() => window.open(`mailto:${teacher.email}?subject=Lesson Plan Feedback`, '_blank')}
                              className="p-3 bg-purple-500/10 text-purple-300 rounded-xl hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-xs font-bold">Feedback</span>
                            </button>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-700/50">
                            <h6 className="text-xs font-black text-gray-400 mb-2">Teacher Info</h6>
                            <div className="text-sm text-gray-300 space-y-1">
                              <p><span className="text-gray-500">Phone:</span> {teacher.phone || 'Not provided'}</p>
                              <p><span className="text-gray-500">Password:</span> {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}</p>
                              <p><span className="text-gray-500">Status:</span> {teacher.isClassTeacher ? `Class Teacher of ${teacher.classTeacherOf?.className}-${teacher.classTeacherOf?.section}` : 'Faculty'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg font-black text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={sendEmailToDefaulters}
            className="p-4 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Email Defaulters</div>
                <div className="text-xs text-gray-400">Send reminders</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => {
              // Download all lesson plans as text
              let textContent = 'All Lesson Plans\n';
              textContent += `Date: ${new Date().toLocaleDateString()}\n`;
              textContent += '='.repeat(50) + '\n\n';
              
              lessonPlans.forEach((plan, index) => {
                const teacher = teachers.find(t => t.email === plan.teacherId);
                textContent += `PLAN #${index + 1}\n`;
                textContent += `Teacher: ${teacher?.name || plan.teacherId}\n`;
                textContent += `Subject: ${plan.subject}\n`;
                textContent += `Class: ${plan.className}-${plan.section}\n`;
                textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
                textContent += `Topics: ${plan.topics.join(', ')}\n`;
                textContent += `Objectives: ${plan.objectives}\n`;
                textContent += `Homework: ${plan.homework}\n`;
                textContent += `Submitted: ${new Date(plan.submittedAt).toLocaleDateString()}\n`;
                textContent += '-'.repeat(40) + '\n\n';
              });
              
              const blob = new Blob([textContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `All_Lesson_Plans_${new Date().toISOString().split('T')[0]}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <DownloadCloud className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Export All Data</div>
                <div className="text-xs text-gray-400">Download Text</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => setShowAddTeacher(true)}
            className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Add Teacher</div>
                <div className="text-xs text-gray-400">New faculty</div>
              </div>
            </div>
          </button>
          
          <button 
            onClick={handleSmartSeed}
            disabled={isSeeding}
            className="p-4 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-xl border border-violet-500/30 hover:border-violet-400/50 transition-all duration-300 group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {isSeeding ? (
                <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
              ) : (
                <CloudUpload className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <div className="text-sm font-bold text-white">Seed Database</div>
                <div className="text-xs text-gray-400">Add initial data</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Defaulter Email Modal */}
      {showDefaulterEmailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Email Defaulters</h3>
                <p className="text-sm text-gray-400">Send reminder emails to teachers with pending submissions</p>
              </div>
              <button
                onClick={() => setShowDefaulterEmailModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-2">Recipients ({selectedDefaulters.length})</label>
              <div className="max-h-40 overflow-y-auto bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                {selectedDefaulters.map(email => {
                  const teacher = teachers.find(t => t.email === email);
                  return (
                    <div key={email} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                      <div>
                        <p className="text-sm text-white">{teacher?.name || email.split('@')[0]}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDefaulters(prev => prev.filter(e => e !== email))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-2">Email Template</label>
              <textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={8}
                className="w-full bg-gray-900/70 border border-gray-700 rounded-xl p-4 text-white resize-none"
                placeholder="Enter your email message here..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={sendBulkEmails}
                disabled={isSendingEmail || selectedDefaulters.length === 0}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Emails ({selectedDefaulters.length})
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDefaulterEmailModal(false)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default AdminRegistry;
