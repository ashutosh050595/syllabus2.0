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
  Loader2, ChevronRight, ChevronLeft, ExternalLink,
  Copy, Share, MoreVertical, Menu, Grid, List,
  Heart, Bookmark, Tag, Image, Video, Music,
  Camera, Mic, Headphones, Battery, BatteryCharging,
  Thermometer, Droplets, Wind, Sun, Moon,
  Star as StarIcon, CloudRain, CloudSnow, CloudLightning,
  Umbrella, Trees, Mountain, Navigation2, Map,
  Users, Check, X, ArrowRight, ArrowLeft, Book,
  File, Folder, FolderOpen, HardDrive, Cpu, Router,
  ShieldAlert, Battery as BatteryFull, ThermometerSun,
  Wind as WindIcon, Sunrise, Sunset, Cloud as CloudIcon,
  Moon as MoonIcon, Sun as SunIcon, Rain as RainIcon,
  Snow as SnowIcon, CloudLightning as LightningIcon,
  // Custom icons for our features
  FileCheck, FileX, FileSearch, FileQuestion,
  ClipboardCheck, ClipboardList, ClipboardX,
  BookmarkCheck, BookmarkX, CalendarCheck,
  CalendarX, CalendarDays, CalendarRange,
  Notebook, NotebookText, NotebookPen,
  School, GraduationCap as GradCap, Chalkboard,
  ChalkboardTeacher, UserCheck, UserX, UserCog,
  Users as UsersIcon, UserPlus, UserMinus,
  BarChart3, PieChart as PieChartIcon, TrendingUp as TrendingUpIcon,
  DownloadCloud, UploadCloud, Save, Share2,
  Link, Unlink, Lock as LockIcon, Unlock,
  Key as KeyIcon, Fingerprint, Shield as ShieldIcon,
  ShieldCheck, ShieldOff, AlertOctagon, Info,
  HelpCircle as HelpCircleIcon, Settings as SettingsIcon,
  Bell as BellIcon, BellOff, BellRing,
  Home as HomeIcon, LogOut as LogOutIcon,
  User as UserIcon, Mail as MailIcon, Phone as PhoneIcon,
  MessageCircle, MessageSquare as MessageSquareIcon,
  Send as SendIcon, Paperclip, Image as ImageIcon,
  Film, Music as MusicIcon, Headphones as HeadphonesIcon,
  Video as VideoIcon, Camera as CameraIcon, Mic as MicIcon,
  Volume2, VolumeX, Play, Pause, StopCircle,
  SkipBack, SkipForward, Repeat, Shuffle,
  Heart as HeartIcon, HeartOff, ThumbsUp as ThumbsUpIcon,
  ThumbsDown, Star as StarIcon2, Flag as FlagIcon,
  Award as AwardIcon, Trophy, Medal, Crown,
  Target as TargetIcon, Crosshair, Compass as CompassIcon,
  Map as MapIcon, Navigation as NavigationIcon,
  Globe as GlobeIcon, MapPin as MapPinIcon,
  // New imports for our features
  Eye as EyeIcon, EyeOff as EyeOffIcon,
  Filter as FilterIcon, Grid as GridIcon,
  List as ListIcon, MoreVertical as MoreVerticalIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  // PDF Generator
  FilePdf,
  // New features
  CheckSquare, Square, Layers, GitMerge,
  GitPullRequest, GitBranch, GitCommit,
  GitCompare, GitMerge as GitMergeIcon,
  GitPullRequest as GitPullRequestIcon,
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitCompare as GitCompareIcon,
  // Additional
  Coffee, Cigarette, Wine, Beer, Cake,
  Pizza, Hamburger, IceCream, Apple,
  Banana, Carrot, Egg, Fish, Milk,
  Coffee as CoffeeIcon, Wine as WineIcon,
  Beer as BeerIcon, Cake as CakeIcon,
  Pizza as PizzaIcon, Hamburger as HamburgerIcon,
  IceCream as IceCreamIcon, Apple as AppleIcon,
  Banana as BananaIcon, Carrot as CarrotIcon,
  Egg as EggIcon, Fish as FishIcon, Milk as MilkIcon
} from 'lucide-react';
import { APIService } from '../services/api-supabase';
import { EmailService } from '../services/email-service';
import { PDFGenerator } from '../services/pdf-generator';
import TeacherModificationRequest from './TeacherModificationRequest';
import { DEFAULT_TEACHER_PASSWORD } from '../constants';

interface TeacherFormProps {
  teacher: any;
  history: any[];
  onRefresh: () => Promise<void>;
  isOnline: boolean;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history, onRefresh, isOnline }) => {
  // =========== STATES ===========
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentWeek, setCurrentWeek] = useState('');
  const [nextWeek, setNextWeek] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  
  // Multi-class form states
  const [selectedClasses, setSelectedClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  // Teacher assignments and submissions
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState<any[]>([]);
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  
  // Class teacher features
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classTeacherInfo, setClassTeacherInfo] = useState<any>(null);
  const [classTeachersStatus, setClassTeachersStatus] = useState<any[]>([]);
  const [classPdfPreview, setClassPdfPreview] = useState<string | null>(null);
  const [showClassStatus, setShowClassStatus] = useState(false);
  
  // Modification request
  const [showModificationRequest, setShowModificationRequest] = useState(false);
  const [selectedWeekForModification, setSelectedWeekForModification] = useState('');
  const [pendingModificationRequests, setPendingModificationRequests] = useState<any[]>([]);
  
  // Success modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionPreview, setSubmissionPreview] = useState<any>(null);

  // =========== WEEK CALCULATION (Runs once) ===========
  useEffect(() => {
    const calculateWeeks = () => {
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
    };

    calculateWeeks();
  }, []);

  // =========== INITIALIZATION ===========
  useEffect(() => {
    const initializeTeacherData = async () => {
      if (!teacher?.email) return;
      
      setIsLoading(true);
      try {
        // Check if teacher is class teacher
        const classTeacher = teacher.isClassTeacher;
        setIsClassTeacher(classTeacher);
        
        if (classTeacher && teacher.classTeacherOf) {
          setClassTeacherInfo(teacher.classTeacherOf);
          if (isOnline) {
            await loadClassTeachersStatus();
          }
        }
        
        // Load teacher data
        if (isOnline) {
          await Promise.all([
            loadTeacherAssignments(),
            loadTeacherSubmissions(),
            loadPendingModificationRequests()
          ]);
        } else {
          // Load from localStorage if offline
          const cachedData = localStorage.getItem(`teacher_${teacher.email}_data`);
          if (cachedData) {
            const data = JSON.parse(cachedData);
            setTeacherAssignments(data.assignments || []);
            setTeacherSubmissions(data.submissions || []);
            setSubmittedWeeks(data.submittedWeeks || []);
          }
        }
        
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTeacherData();
  }, [teacher?.email, teacher?.isClassTeacher, isOnline]);

  // =========== DATA LOADING FUNCTIONS ===========
  const loadTeacherAssignments = async () => {
    if (!isOnline || !teacher?.email) return;
    
    try {
      const assignments = await APIService.getTeacherAssignments(teacher.email);
      setTeacherAssignments(assignments);
      
      // Cache data for offline use
      const cachedData = {
        assignments,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`teacher_${teacher.email}_assignments`, JSON.stringify(cachedData));
      
      // Initialize form data for each assignment
      const initialFormData: Record<string, any> = {};
      assignments.forEach((assignment: any) => {
        const key = `${assignment.className}_${assignment.sections?.[0] || 'A'}_${assignment.subject}`;
        initialFormData[key] = {
          className: assignment.className,
          section: assignment.sections?.[0] || 'A',
          subject: assignment.subject,
          weekRange: selectedWeek || currentWeek,
          chapter: '',
          topics: '',
          homework: ''
        };
      });
      
      setFormData(initialFormData);
      
    } catch (error) {
      console.error('Error loading assignments:', error);
      // Try to load from cache on error
      const cached = localStorage.getItem(`teacher_${teacher.email}_assignments`);
      if (cached) {
        const data = JSON.parse(cached);
        setTeacherAssignments(data.assignments || []);
      }
    }
  };

  const loadTeacherSubmissions = async () => {
    if (!isOnline || !teacher?.email) return;
    
    try {
      const submissions = await APIService.fetchLessonPlans();
      const teacherSubs = submissions.filter(s => s.teacherId === teacher.email);
      setTeacherSubmissions(teacherSubs);
      
      // Extract unique week ranges
      const weeks = [...new Set(teacherSubs.map(s => s.weekRange))].sort();
      setSubmittedWeeks(weeks);
      
      // Cache data
      const cacheData = {
        submissions: teacherSubs,
        submittedWeeks: weeks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`teacher_${teacher.email}_submissions`, JSON.stringify(cacheData));
      
    } catch (error) {
      console.error('Error loading submissions:', error);
      // Load from cache
      const cached = localStorage.getItem(`teacher_${teacher.email}_submissions`);
      if (cached) {
        const data = JSON.parse(cached);
        setTeacherSubmissions(data.submissions || []);
        setSubmittedWeeks(data.submittedWeeks || []);
      }
    }
  };

  const loadClassTeachersStatus = async () => {
    if (!isOnline || !isClassTeacher || !classTeacherInfo) return;
    
    try {
      const { className, section } = classTeacherInfo;
      const [allTeachers, allLessonPlans] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans()
      ]);
      
      // Get teachers assigned to this class
      const assignedTeachers = allTeachers.filter(t => 
        t.assignments?.some((a: any) => 
          a.className === className && a.sections?.includes(section)
        )
      );
      
      // Check submission status for current week
      const status = assignedTeachers.map(t => {
        const hasSubmitted = allLessonPlans.some(plan => 
          plan.teacherId === t.email && 
          plan.className === className && 
          plan.section === section && 
          plan.weekRange === currentWeek
        );
        
        return {
          teacher: t,
          submitted: hasSubmitted,
          subject: t.assignments?.find((a: any) => 
            a.className === className && a.sections?.includes(section)
          )?.subject || 'N/A'
        };
      });
      
      setClassTeachersStatus(status);
      
    } catch (error) {
      console.error('Error loading class teachers status:', error);
    }
  };

  const loadPendingModificationRequests = async () => {
    if (!isOnline || !teacher?.email) return;
    
    try {
      const requests = await APIService.getResubmissionRequests(teacher.email, '');
      const pending = requests.filter((req: any) => req.status === 'pending');
      setPendingModificationRequests(pending);
      
    } catch (error) {
      console.error('Error loading modification requests:', error);
    }
  };

  // =========== FORM HANDLING ===========
  const handleClassToggle = (assignment: any) => {
    const key = `${assignment.className}_${assignment.sections?.[0] || 'A'}_${assignment.subject}`;
    
    if (selectedClasses.some(c => c.key === key)) {
      // Remove from selection
      setSelectedClasses(prev => prev.filter(c => c.key !== key));
    } else {
      // Add to selection
      setSelectedClasses(prev => [...prev, {
        key,
        className: assignment.className,
        section: assignment.sections?.[0] || 'A',
        subject: assignment.subject
      }]);
      
      // Initialize form data if not exists
      if (!formData[key]) {
        setFormData(prev => ({
          ...prev,
          [key]: {
            className: assignment.className,
            section: assignment.sections?.[0] || 'A',
            subject: assignment.subject,
            weekRange: selectedWeek || currentWeek,
            chapter: '',
            topics: '',
            homework: ''
          }
        }));
      }
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === teacherAssignments.length) {
      // Deselect all
      setSelectedClasses([]);
    } else {
      // Select all
      const allClasses = teacherAssignments.map(assignment => ({
        key: `${assignment.className}_${assignment.sections?.[0] || 'A'}_${assignment.subject}`,
        className: assignment.className,
        section: assignment.sections?.[0] || 'A',
        subject: assignment.subject
      }));
      setSelectedClasses(allClasses);
      
      // Initialize form data for all
      const newFormData: Record<string, any> = { ...formData };
      allClasses.forEach(cls => {
        if (!newFormData[cls.key]) {
          newFormData[cls.key] = {
            className: cls.className,
            section: cls.section,
            subject: cls.subject,
            weekRange: selectedWeek || currentWeek,
            chapter: '',
            topics: '',
            homework: ''
          };
        }
      });
      setFormData(newFormData);
    }
  };

  const handleInputChange = (key: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      alert('📡 No internet connection. Please check your network.');
      return;
    }
    
    if (selectedClasses.length === 0) {
      alert('❌ Please select at least one class to submit.');
      return;
    }
    
    // Validate all selected classes
    const errors = [];
    selectedClasses.forEach(cls => {
      const data = formData[cls.key];
      if (!data.chapter?.trim()) errors.push(`Chapter for ${cls.className}-${cls.section} (${cls.subject})`);
      if (!data.topics?.trim()) errors.push(`Topics for ${cls.className}-${cls.section} (${cls.subject})`);
      if (!data.homework?.trim()) errors.push(`Homework for ${cls.className}-${cls.section} (${cls.subject})`);
    });
    
    if (errors.length > 0) {
      alert(`❌ Please fill all required fields:\n\n${errors.join('\n')}`);
      return;
    }
    
    setSubmissionStatus('submitting');
    setIsSubmitting(true);
    
    try {
      const submissionResults = [];
      
      for (const cls of selectedClasses) {
        const data = formData[cls.key];
        
        const submissionData = {
          className: data.className,
          section: data.section,
          subject: data.subject,
          weekRange: selectedWeek,
          topics: `${data.chapter}\n\nTopics:\n${data.topics}`,
          assessment: data.homework,
          teacherId: teacher.email,
          teacherName: teacher.name,
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        };
        
        const result = await APIService.submitLessonPlan(submissionData);
        submissionResults.push({
          class: `${data.className}-${data.section}`,
          subject: data.subject,
          success: true
        });
        
        // Update local state
        setTeacherSubmissions(prev => [...prev, submissionData]);
      }
      
      // Update submitted weeks
      if (!submittedWeeks.includes(selectedWeek)) {
        setSubmittedWeeks(prev => [...prev, selectedWeek].sort());
      }
      
      // Send confirmation email
      const submittedClasses = selectedClasses.map(cls => 
        `${cls.className}-${cls.section} (${cls.subject})`
      );
      
      let emailSent = false;
      if (isOnline) {
        try {
          emailSent = await EmailService.sendEmail(
            EmailService.createSubmissionConfirmation(
              teacher.name,
              teacher.email,
              selectedWeek,
              submittedClasses
            )
          );
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          emailSent = false;
        }
      }
      
      setSubmissionStatus('success');
      setSubmissionPreview({
        week: selectedWeek,
        classes: submissionResults,
        timestamp: new Date(),
        emailSent
      });
      setShowSubmissionModal(true);
      
      // Clear form for submitted classes
      const newFormData = { ...formData };
      selectedClasses.forEach(cls => {
        if (newFormData[cls.key]) {
          newFormData[cls.key] = {
            ...newFormData[cls.key],
            chapter: '',
            topics: '',
            homework: ''
          };
        }
      });
      setFormData(newFormData);
      setSelectedClasses([]);
      
      // Refresh data
      await loadTeacherSubmissions();
      if (isClassTeacher) await loadClassTeachersStatus();
      
      // Clear cache after submission
      localStorage.removeItem(`teacher_${teacher.email}_submissions`);
      
    } catch (error: any) {
      console.error('❌ Error submitting lesson plans:', error);
      setSubmissionStatus('error');
      alert(`Failed to submit: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========== CLASS TEACHER FEATURES ===========
  const generateClassPdf = async () => {
    if (!isClassTeacher || !classTeacherInfo || !isOnline) {
      alert('❌ You are not a class teacher or offline.');
      return;
    }
    
    try {
      const { className, section } = classTeacherInfo;
      const [allTeachers, allLessonPlans] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans()
      ]);
      
      const pdfBase64 = PDFGenerator.generatePDFFromLessonPlans(
        className,
        section,
        currentWeek,
        teacher.name,
        allLessonPlans,
        allTeachers
      );
      
      setClassPdfPreview(pdfBase64);
      
      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `Class_${className}_${section}_${currentWeek.replace(/ /g, '_')}.pdf`;
      link.click();
      
      alert(`✅ PDF generated for ${className}-${section}`);
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('❌ Failed to generate PDF: ' + error.message);
    }
  };

  const previewClassPdf = async () => {
    if (!isClassTeacher || !classTeacherInfo || !isOnline) {
      alert('❌ You are not a class teacher or offline.');
      return;
    }
    
    try {
      const { className, section } = classTeacherInfo;
      const [allTeachers, allLessonPlans] = await Promise.all([
        APIService.fetchTeachers(),
        APIService.fetchLessonPlans()
      ]);
      
      const pdfBase64 = PDFGenerator.generatePDFFromLessonPlans(
        className,
        section,
        currentWeek,
        teacher.name,
        allLessonPlans,
        allTeachers
      );
      
      // Open PDF in new tab
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(`
          <html>
            <head>
              <title>PDF Preview - ${className}-${section}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="data:application/pdf;base64,${pdfBase64}"></iframe>
            </body>
          </html>
        `);
      }
      
    } catch (error: any) {
      console.error('Error previewing PDF:', error);
      alert('❌ Failed to preview PDF: ' + error.message);
    }
  };

  // =========== MODIFICATION REQUEST ===========
  const handleRequestModification = (weekRange: string) => {
    // Check if already has pending request for this week
    const existingRequest = pendingModificationRequests.find(
      req => req.week_range === weekRange
    );
    
    if (existingRequest) {
      alert(`⚠️ You already have a pending modification request for ${weekRange}.\n\nRequest ID: ${existingRequest.id}\nStatus: ${existingRequest.status}`);
      return;
    }
    
    setSelectedWeekForModification(weekRange);
    setShowModificationRequest(true);
  };

  // =========== RENDER FUNCTIONS ===========
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Dashboard</p>
            <p className="text-xs text-slate-500">Welcome, {teacher.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =========== WELCOME CARD =========== */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tight">
              Welcome, {teacher.name}!
              {isClassTeacher && (
                <span className="ml-3 text-sm bg-white/20 px-3 py-1 rounded-full">
                  👨‍🏫 Class Teacher
                </span>
              )}
            </h1>
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
            {isClassTeacher && classTeacherInfo && (
              <div className="mt-4 text-center">
                <div className="text-xs text-indigo-200">Class Teacher of</div>
                <div className="text-lg font-bold bg-white/10 px-4 py-2 rounded-lg mt-1">
                  {classTeacherInfo.className}-{classTeacherInfo.section}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========== CLASS TEACHER DASHBOARD =========== */}
      {isClassTeacher && classTeacherInfo && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Class Teacher Dashboard
              </h3>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                {classTeacherInfo.className}-{classTeacherInfo.section}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClassStatus(!showClassStatus)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
              >
                {showClassStatus ? 'Hide Status' : 'Show Status'}
              </button>
              <button
                onClick={previewClassPdf}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-200"
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Preview PDF
              </button>
              <button
                onClick={generateClassPdf}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Download PDF
              </button>
            </div>
          </div>

          {showClassStatus && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-4">Submission Status for {currentWeek}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classTeachersStatus.map((status, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${status.submitted ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{status.teacher.name}</div>
                        <div className="text-sm text-slate-600">{status.subject}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${status.submitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {status.submitted ? '✅ Submitted' : '⏳ Pending'}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Email: {status.teacher.email}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Total Teachers: {classTeachersStatus.length}
                  </div>
                  <div className="text-sm font-bold">
                    <span className="text-emerald-600">Submitted: {classTeachersStatus.filter(s => s.submitted).length}</span>
                    {' • '}
                    <span className="text-amber-600">Pending: {classTeachersStatus.filter(s => !s.submitted).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600">
            <p className="mb-2">
              <strong>Class:</strong> {classTeacherInfo.className}-{classTeacherInfo.section}
            </p>
            <p className="mb-2">
              <strong>Current Week:</strong> {currentWeek}
            </p>
            <p>
              <strong>Note:</strong> As class teacher, you can track submissions and download weekly PDFs.
            </p>
          </div>
        </div>
      )}

      {/* =========== WEEK SELECTION =========== */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black uppercase italic tracking-tight mb-4">Select Week</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedWeek(currentWeek)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedWeek === currentWeek ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Current Week: {currentWeek}
          </button>
          <button
            onClick={() => setSelectedWeek(nextWeek)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedWeek === nextWeek ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Next Week: {nextWeek}
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          Selected: <span className="font-bold text-indigo-600">{selectedWeek}</span>
        </p>
      </div>

      {/* =========== MULTI-CLASS SUBMISSION FORM =========== */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Lesson Plan Submission</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
              Submit for multiple classes at once
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllClasses}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200"
            >
              {selectedClasses.length === teacherAssignments.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={async () => {
                await onRefresh();
                await loadTeacherAssignments();
                await loadTeacherSubmissions();
                if (isClassTeacher) await loadClassTeachersStatus();
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Class Selection */}
        {teacherAssignments.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-slate-700 mb-4">Select Classes to Submit:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teacherAssignments.map((assignment, idx) => {
                const key = `${assignment.className}_${assignment.sections?.[0] || 'A'}_${assignment.subject}`;
                const isSelected = selectedClasses.some(c => c.key === key);
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleClassToggle(assignment)}
                    className={`p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{assignment.subject}</div>
                        <div className="text-sm text-slate-600">Class {assignment.className}</div>
                        <div className="text-xs text-slate-500">
                          Section: {assignment.sections?.join(', ') || 'A'}
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form for Selected Classes */}
        {selectedClasses.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-8">
              {selectedClasses.map((cls, idx) => {
                const data = formData[cls.key] || {};
                
                return (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-slate-900">
                        {cls.className}-{cls.section} ({cls.subject})
                      </h4>
                      <div className="text-sm text-slate-500">
                        Week: {selectedWeek}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Chapter Name */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Name of the Chapter to be taught in current week *
                        </label>
                        <input
                          type="text"
                          value={data.chapter || ''}
                          onChange={(e) => handleInputChange(cls.key, 'chapter', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                          placeholder="Enter chapter name..."
                          required
                        />
                      </div>
                      
                      {/* Topics/Subtopics */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Topics/Subtopics of the Chapter to be taught *
                        </label>
                        <textarea
                          value={data.topics || ''}
                          onChange={(e) => handleInputChange(cls.key, 'topics', e.target.value)}
                          className="w-full h-32 px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 resize-none"
                          placeholder="Enter topics/subtopics..."
                          required
                        />
                      </div>
                      
                      {/* Proposed Homework */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Proposed Home Work *
                        </label>
                        <textarea
                          value={data.homework || ''}
                          onChange={(e) => handleInputChange(cls.key, 'homework', e.target.value)}
                          className="w-full h-32 px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 resize-none"
                          placeholder="Enter homework assignment..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    Submitting {selectedClasses.length} lesson plans...
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="h-6 w-6" />
                    Offline - Cannot Submit
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    Submit {selectedClasses.length} Lesson Plan{selectedClasses.length > 1 ? 's' : ''}
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
        )}

        {selectedClasses.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No classes selected</p>
            <p className="text-slate-300 text-sm mt-2">Select classes above to start submitting lesson plans</p>
          </div>
        )}
      </div>

      {/* =========== SUBMISSION HISTORY =========== */}
      {(submittedWeeks.length > 0 || teacherSubmissions.length > 0) && (
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
              <div className="text-sm text-slate-500">Pending Requests</div>
              <div className={`text-2xl font-black ${pendingModificationRequests.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingModificationRequests.length}
              </div>
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
              
              const hasPendingRequest = pendingModificationRequests.some(
                req => req.week_range === week
              );
              
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
                                {sub.className} {sub.section && `(${sub.section})`}
                              </span>
                            ))}
                            {weekSubmissions.length > 3 && (
                              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                +{weekSubmissions.length - 3} more
                              </span>
                            )}
                          </div>
                          {hasPendingRequest && (
                            <div className="mt-2">
                              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                ⚠️ Modification Request Pending
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const message = `📋 Submission Details for ${week}:\n\n` +
                            weekSubmissions.map((sub, idx) => 
                              `${idx + 1}. ${sub.className} ${sub.section ? `(${sub.section})` : ''} - ${sub.subject || 'No subject'}\n   📝 Chapter: ${sub.topics?.split('\n')[0] || 'Not specified'}\n   📚 Topics: ${sub.topics?.split('\n').slice(1).join(', ') || 'Not specified'}\n   🏠 Homework: ${sub.assessment || 'Not specified'}`
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
                        disabled={hasPendingRequest}
                        className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-md ${hasPendingRequest ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'}`}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {hasPendingRequest ? 'Request Pending' : 'Request Modification'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              📝 Note: You can request modification only once per week per class.
            </p>
          </div>
        </div>
      )}

      {/* =========== SUBMISSION SUCCESS MODAL =========== */}
      {showSubmissionModal && submissionPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">✅ Submission Successful!</h3>
              <p className="text-slate-600">
                Your lesson plans have been submitted for review.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-6">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Week</div>
                  <div className="font-bold text-indigo-600">{submissionPreview.week}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Submitted Classes</div>
                  <div className="font-bold text-slate-900">
                    {submissionPreview.classes.map((c: any) => c.class).join(', ')}
                  </div>
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
                <div>
                  <div className="text-xs text-slate-500">Email Confirmation</div>
                  <div className="font-bold text-emerald-600">
                    {submissionPreview.emailSent ? '✅ Sent' : '⚠️ Not Sent'}
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
            </div>
          </div>
        </div>
      )}

      {/* =========== MODIFICATION REQUEST MODAL =========== */}
      {showModificationRequest && (
        <TeacherModificationRequest
          teacher={teacher}
          weekRange={selectedWeekForModification}
          submissions={teacherSubmissions}
          onRequestSubmitted={() => {
            setShowModificationRequest(false);
            onRefresh();
            loadTeacherSubmissions();
            loadPendingModificationRequests();
          }}
          onClose={() => setShowModificationRequest(false)}
        />
      )}

      {/* =========== OFFLINE WARNING =========== */}
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
