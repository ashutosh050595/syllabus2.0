import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, BookOpen, Upload, Clock, AlertCircle, 
  CheckCircle2, XCircle, RefreshCw, FileText, Plus,
  User, Mail, Phone, Edit3, Trash2, Search, Filter,
  Download, Printer, Eye, EyeOff, Send, History,
  ChevronDown, ChevronUp, AlertTriangle, Lock, Key,
  LogOut, Home, Bell, Settings, HelpCircle, Star,
  BarChart, PieChart, TrendingUp, Shield, Zap,
  MessageSquare, ThumbsUp, Award, Target, Flag,
  Compass, Navigation, MapPin, Globe, Cloud,
  CloudOff, Wifi, WifiOff, Database, Server,
  Cpu, HardDrive, MemoryStick, Router, ShieldAlert,
  X, Loader2, ChevronRight, ChevronLeft, ExternalLink,
  Copy, Share, MoreVertical, Menu, Grid, List,
  Heart, Bookmark, Tag, Image, Video, Music,
  Camera, Mic, Headphones, Battery, BatteryCharging,
  Thermometer, Droplets, Wind, Sun, Moon,
  Star as StarIcon, CloudRain, CloudSnow, CloudLightning,
  Umbrella, Trees, Mountain, Navigation2, Map,
  // ADD THIS IMPORT
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { APIService } from '../services/api-supabase';
import { EmailService } from '../services/email-service';
import { generateWeekRange, getCurrentWeek, getNextWeek } from '../utils/dateUtils';
import { DEFAULT_TEACHER_PASSWORD } from '../constants';
// ADD THIS IMPORT
import TeacherModificationRequest from './TeacherModificationRequest';

interface TeacherFormProps {
  teacher: any;
  history: any[];
  onRefresh: () => Promise<void>;
  isOnline: boolean;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history, onRefresh, isOnline }) => {
  // Existing states
  const [formData, setFormData] = useState({
    className: '',
    section: '',
    subject: '',
    weekRange: '',
    topics: '',
    objectives: '',
    activities: '',
    resources: '',
    assessment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentWeek, setCurrentWeek] = useState('');
  const [nextWeek, setNextWeek] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionPreview, setSubmissionPreview] = useState<any>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'class' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    submitted: 0
  });
  
  // NEW STATES FOR MODIFICATION FEATURE
  const [showModificationRequest, setShowModificationRequest] = useState(false);
  const [selectedWeekForModification, setSelectedWeekForModification] = useState('');
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([]);

  // Load teacher submissions for modification feature
  useEffect(() => {
    loadTeacherSubmissions();
  }, [teacher, isOnline]);

  const loadTeacherSubmissions = async () => {
    if (!isOnline || !teacher?.email) return;
    
    try {
      const submissions = await APIService.fetchLessonPlans();
      const teacherSubs = submissions.filter(s => s.teacherId === teacher.email);
      setTeacherSubmissions(teacherSubs);
      
      // Extract unique week ranges
      const weeks = [...new Set(teacherSubs.map(s => s.weekRange))].sort();
      setSubmittedWeeks(weeks);
      
      console.log(`📊 Loaded ${teacherSubs.length} submissions for ${teacher.name}`);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  // Existing useEffect for current week
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const currentWeekRange = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
    setCurrentWeek(currentWeekRange);
    
    const nextWeekStart = new Date(startOfWeek);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(endOfWeek);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    const nextWeekRange = `${formatDate(nextWeekStart)} to ${formatDate(nextWeekEnd)}`;
    setNextWeek(nextWeekRange);
    
    setSelectedWeek(currentWeekRange);
    setFormData(prev => ({ ...prev, weekRange: currentWeekRange }));
  }, []);

  // Existing useEffect for teacher assignments
  useEffect(() => {
    const loadAssignments = async () => {
      if (!isOnline || !teacher?.email) return;
      
      setIsLoadingAssignments(true);
      try {
        const assignments = await APIService.getTeacherAssignments(teacher.email);
        setTeacherAssignments(assignments);
        
        if (assignments.length > 0) {
          const firstAssignment = assignments[0];
          setFormData(prev => ({
            ...prev,
            className: firstAssignment.className || '',
            subject: firstAssignment.subject || ''
          }));
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    
    loadAssignments();
  }, [teacher, isOnline]);

  // Existing useEffect for history filtering
  useEffect(() => {
    let filtered = [...history];
    
    if (historyFilter !== 'all') {
      filtered = filtered.filter(item => item.status === historyFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.weekRange?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      const aValue = sortBy === 'date' ? new Date(a.submittedAt || a.createdAt).getTime() :
                     sortBy === 'class' ? a.className || '' : a.subject || '';
      const bValue = sortBy === 'date' ? new Date(b.submittedAt || b.createdAt).getTime() :
                     sortBy === 'class' ? b.className || '' : b.subject || '';
      
      if (sortBy === 'date') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
    
    setFilteredHistory(filtered);
  }, [history, historyFilter, searchTerm, sortBy, sortOrder]);

  // Existing useEffect for stats
  useEffect(() => {
    const calculateStats = () => {
      const totalSubmissions = history.length;
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthSubmissions = history.filter(item => {
        const date = new Date(item.submittedAt || item.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length;
      
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      const lastMonthSubmissions = history.filter(item => {
        const date = new Date(item.submittedAt || item.createdAt);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).length;
      
      const pending = history.filter(item => item.status === 'draft' || item.status === 'pending').length;
      const submitted = history.filter(item => item.status === 'submitted' || item.status === 'approved').length;
      
      setStats({
        totalSubmissions,
        thisMonth: thisMonthSubmissions,
        lastMonth: lastMonthSubmissions,
        pending,
        submitted
      });
    };
    
    calculateStats();
  }, [history]);

  // Existing function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      alert('📡 No internet connection. Please check your network.');
      return;
    }
    
    if (!formData.className || !formData.section || !formData.subject || !formData.weekRange) {
      alert('❌ Please fill all required fields: Class, Section, Subject, and Week.');
      return;
    }
    
    setSubmissionStatus('submitting');
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        teacherId: teacher.email,
        teacherName: teacher.name,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };
      
      console.log('📝 Submitting lesson plan:', submissionData);
      
      const result = await APIService.submitLessonPlan(submissionData);
      
      console.log('✅ Lesson plan submitted:', result);
      
      // Send confirmation email
      const emailSent = await EmailService.sendEmail(
        EmailService.createSubmissionConfirmation(
          teacher.name,
          teacher.email,
          formData.weekRange,
          [`${formData.className}-${formData.section} (${formData.subject})`]
        )
      );
      
      if (emailSent) {
        console.log('📧 Confirmation email sent');
      } else {
        console.log('⚠️ Confirmation email failed');
      }
      
      setSubmissionStatus('success');
      setSubmissionPreview(submissionData);
      setShowSubmissionModal(true);
      
      // Reset form
      setFormData({
        className: '',
        section: '',
        subject: '',
        weekRange: selectedWeek,
        topics: '',
        objectives: '',
        activities: '',
        resources: '',
        assessment: ''
      });
      
      // Refresh data
      await onRefresh();
      await loadTeacherSubmissions();
      
    } catch (error: any) {
      console.error('❌ Error submitting lesson plan:', error);
      setSubmissionStatus('error');
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Existing function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Existing function to handle week selection
  const handleWeekSelect = (week: string) => {
    setSelectedWeek(week);
    setFormData(prev => ({ ...prev, weekRange: week }));
  };

  // Existing function to handle assignment selection
  const handleAssignmentSelect = (assignment: any) => {
    setFormData(prev => ({
      ...prev,
      className: assignment.className || '',
      subject: assignment.subject || '',
      section: assignment.sections?.[0] || ''
    }));
  };

  // Existing function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // NEW FUNCTION: Handle modification request
  const handleRequestModification = (weekRange: string) => {
    setSelectedWeekForModification(weekRange);
    setShowModificationRequest(true);
  };

  // Existing render function continues...
  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tight">Welcome, {teacher.name}!</h1>
            <p className="text-indigo-100 mt-2">Submit your weekly lesson plans here</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{teacher.email}</span>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{teacher.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-bold">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-bold">Offline</span>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-xs text-indigo-200">Teacher ID</div>
              <div className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg mt-1">
                {teacher.email.split('@')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Selection */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black uppercase italic tracking-tight mb-4">Select Week</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleWeekSelect(currentWeek)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedWeek === currentWeek ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Current Week: {currentWeek}
          </button>
          <button
            onClick={() => handleWeekSelect(nextWeek)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedWeek === nextWeek ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Next Week: {nextWeek}
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          Selected: <span className="font-bold text-indigo-600">{selectedWeek}</span>
        </p>
      </div>

      {/* Assignments Quick Select */}
      {teacherAssignments.length > 0 && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black uppercase italic tracking-tight">Your Assignments</h3>
            <span className="text-sm text-slate-500">{teacherAssignments.length} classes</span>
          </div>
          
          {isLoadingAssignments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teacherAssignments.map((assignment, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAssignmentSelect(assignment)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    formData.className === assignment.className && formData.subject === assignment.subject
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">{assignment.subject}</div>
                      <div className="text-sm text-slate-600">Class {assignment.className}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                  {assignment.sections && assignment.sections.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-slate-500">Sections:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assignment.sections.map((section: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson Plan Form */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tight">Lesson Plan Form</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormData({
                className: '',
                section: '',
                subject: '',
                weekRange: selectedWeek,
                topics: '',
                objectives: '',
                activities: '',
                resources: '',
                assessment: ''
              })}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
            >
              Clear Form
            </button>
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Class <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                placeholder="e.g., 10, 11, 12"
                required
                disabled={!isOnline}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Section <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                placeholder="e.g., A, B, C"
                required
                disabled={!isOnline}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                placeholder="e.g., Mathematics, Science"
                required
                disabled={!isOnline}
              />
            </div>
          </div>

          {/* Week Display (Read-only) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Week Range <span className="text-rose-500">*</span>
            </label>
            <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-bold">
              {selectedWeek}
            </div>
            <input type="hidden" name="weekRange" value={selectedWeek} />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Topics/Chapter
            </label>
            <textarea
              name="topics"
              value={formData.topics}
              onChange={handleInputChange}
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
              placeholder="Enter topics or chapter name..."
              disabled={!isOnline}
            />
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Learning Objectives
            </label>
            <textarea
              name="objectives"
              value={formData.objectives}
              onChange={handleInputChange}
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
              placeholder="What students will learn..."
              disabled={!isOnline}
            />
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Teaching Activities
            </label>
            <textarea
              name="activities"
              value={formData.activities}
              onChange={handleInputChange}
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
              placeholder="Classroom activities, discussions, experiments..."
              disabled={!isOnline}
            />
          </div>

          {/* Resources & Assessment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Teaching Resources
              </label>
              <textarea
                name="resources"
                value={formData.resources}
                onChange={handleInputChange}
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
                placeholder="Textbooks, presentations, lab equipment..."
                disabled={!isOnline}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Assessment
              </label>
              <textarea
                name="assessment"
                value={formData.assessment}
                onChange={handleInputChange}
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
                placeholder="Tests, quizzes, projects, homework..."
                disabled={!isOnline}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                isSubmitting || !isOnline
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Submitting...
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff className="h-6 w-6" />
                  Offline - Cannot Submit
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  Submit Lesson Plan
                </>
              )}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                {isOnline ? (
                  '✅ Connected to server. Your data will be saved instantly.'
                ) : (
                  <span className="text-amber-600">
                    ⚠️ You are offline. Please connect to internet to submit.
                  </span>
                )}
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* NEW: Submission History with Modification Feature */}
      {(submittedWeeks.length > 0 || history.length > 0) && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Submission History</h3>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                {submittedWeeks.length} weeks submitted • {teacherSubmissions.length} total submissions
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadTeacherSubmissions}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl"
                title="Refresh submissions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
              >
                {showHistory ? 'Hide' : 'Show'} Details
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-sm text-slate-500">Total Weeks</div>
              <div className="text-2xl font-black text-slate-900">{submittedWeeks.length}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-sm text-slate-500">Total Submissions</div>
              <div className="text-2xl font-black text-slate-900">{teacherSubmissions.length}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-sm text-slate-500">This Month</div>
              <div className="text-2xl font-black text-slate-900">
                {teacherSubmissions.filter(s => {
                  const date = new Date(s.submittedAt || s.createdAt);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-sm text-slate-500">Status</div>
              <div className="text-2xl font-black text-emerald-600">Active</div>
            </div>
          </div>

          {/* Submitted Weeks List */}
          <div className="space-y-4">
            {submittedWeeks.map(week => {
              const weekSubmissions = teacherSubmissions.filter(s => s.weekRange === week);
              const submissionDate = weekSubmissions[0]?.submittedAt 
                ? new Date(weekSubmissions[0].submittedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recently';
              
              return (
                <div key={week} className="p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl hover:border-indigo-300 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                          <Calendar className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg">{week}</div>
                          <div className="text-sm text-slate-500">
                            Submitted on: {submissionDate}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {weekSubmissions.slice(0, 3).map((sub, idx) => (
                              <span key={idx} className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded hover:border-indigo-300 transition-colors">
                                {sub.className || sub.class} {sub.section && `(${sub.section})`}
                              </span>
                            ))}
                            {weekSubmissions.length > 3 && (
                              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                +{weekSubmissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // View details
                          const message = `📋 Submission Details for ${week}:\n\n` +
                            weekSubmissions.map((sub, idx) => 
                              `${idx + 1}. ${sub.className || sub.class} ${sub.section ? `(${sub.section})` : ''} - ${sub.subject || 'No subject'}\n   📝 Topics: ${sub.topics || 'Not specified'}`
                            ).join('\n\n');
                          alert(message);
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 flex items-center gap-2 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleRequestModification(week)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold text-xs hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all shadow-md"
                      >
                        <RefreshIcon className="h-3 w-3" />
                        Request Modification
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              📝 Click "Request Modification" to request changes for any submission. Admin approval required.
            </p>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {showSubmissionModal && submissionPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">✅ Submission Successful!</h3>
              <p className="text-slate-600">
                Your lesson plan has been submitted for review.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-6">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Class & Section</div>
                  <div className="font-bold text-slate-900">
                    {submissionPreview.className}-{submissionPreview.section}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Subject</div>
                  <div className="font-bold text-slate-900">{submissionPreview.subject}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Week</div>
                  <div className="font-bold text-indigo-600">{submissionPreview.weekRange}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submission Time</div>
                  <div className="font-bold text-slate-900">
                    {new Date().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSubmissionPreview(null);
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  copyToClipboard(`Lesson Plan Submitted\nClass: ${submissionPreview.className}-${submissionPreview.section}\nSubject: ${submissionPreview.subject}\nWeek: ${submissionPreview.weekRange}\nSubmitted: ${new Date().toLocaleString()}`);
                  alert('Details copied to clipboard!');
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
              >
                Copy Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modification Request Modal */}
      {showModificationRequest && (
        <TeacherModificationRequest
          teacher={teacher}
          weekRange={selectedWeekForModification}
          submissions={teacherSubmissions}
          onRequestSubmitted={() => {
            setShowModificationRequest(false);
            onRefresh();
            loadTeacherSubmissions();
          }}
          onClose={() => setShowModificationRequest(false)}
        />
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:right-6 md:w-96 z-40">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-bold text-amber-800">You are offline</p>
                <p className="text-sm text-amber-600">Some features may be limited. Connect to internet for full functionality.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherForm;
