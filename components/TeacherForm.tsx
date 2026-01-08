import React, { useState, useEffect } from 'react';
import { 
  Loader2, Send, BookOpen, CheckCircle2, CheckSquare, Square, 
  Layers, ChevronRight, AlertCircle, History, AlertTriangle, 
  Clock, Info, Calendar, Mail, User, Check, Wifi, WifiOff,
  Edit3, RefreshCw, Sparkles, Download, Upload, Bell,
  AlertOctagon, FileText, Shield, Rocket, Target
} from 'lucide-react';
import { Teacher, LessonPlan, ClassName } from '../types';
import { APIService } from '../services/api-supabase';
import { getUpcomingMonday, formatDate, getNextSaturday, getWeekLabel, isFutureWeek, getWeekRangeLabel } from '../utils';

interface TeacherFormProps {
  teacher: Teacher;
  history: LessonPlan[];
  onRefresh: () => Promise<void>;
  isOnline: boolean;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history: planHistory, onRefresh, isOnline }) => {
  const upcomingMonday = getUpcomingMonday();
  const nextSaturday = getNextSaturday(upcomingMonday);
  const weekLabel = getWeekLabel(upcomingMonday);
  const weekRange = getWeekRangeLabel(upcomingMonday);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedThisWeek, setSubmittedThisWeek] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [canSubmit, setCanSubmit] = useState(true);
  const [existingSubmission, setExistingSubmission] = useState<LessonPlan | null>(null);
  const [showSubmissionInfo, setShowSubmissionInfo] = useState(true);
  const [submissionTimeout, setSubmissionTimeout] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    chapter: '', 
    topics: '', 
    homework: ''  // Removed other fields, kept only these 3
  });
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isRequestingModification, setIsRequestingModification] = useState(false);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => console.log('Online');
    const handleOffline = () => console.log('Offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Group assignments by Grade
  const groupedAssignments = teacher.assignments.reduce((acc, asgn) => {
    if (!acc[asgn.className]) acc[asgn.className] = [];
    asgn.sections.forEach(sec => {
      acc[asgn.className].push({ section: sec, subject: asgn.subject });
    });
    return acc;
  }, {} as Record<string, { section: string, subject: string }[]>);

  // Check if teacher has already submitted for this week
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        const currentWeekStart = upcomingMonday.toISOString();
        const submissions = planHistory.filter(plan => plan.weekStarting === currentWeekStart);
        
        if (submissions.length > 0) {
          const firstSubmission = submissions[0];
          setExistingSubmission(firstSubmission);
          
          if (isFutureWeek(upcomingMonday)) {
            setCanSubmit(false);
            setErrorMessage("Submission for future weeks is not permitted.");
            return;
          }
          
          if (firstSubmission.resubmissionStatus === 'none') {
            setSubmittedThisWeek(true);
            setCanSubmit(false);
            setErrorMessage("");
          } else if (firstSubmission.resubmissionStatus === 'pending') {
            setCanSubmit(false);
            setErrorMessage("Modification request pending approval.");
          } else if (firstSubmission.resubmissionStatus === 'approved') {
            setCanSubmit(true);
            setSubmittedThisWeek(false);
            setErrorMessage("");
          } else if (firstSubmission.resubmissionStatus === 'resubmitted') {
            setSubmittedThisWeek(true);
            setCanSubmit(false);
            setErrorMessage("Already resubmitted for this week.");
          }
        } else {
          if (isFutureWeek(upcomingMonday)) {
            setCanSubmit(false);
            setErrorMessage("Submission for future weeks is not permitted.");
            return;
          }
          
          setCanSubmit(true);
          setSubmittedThisWeek(false);
          setErrorMessage("");
        }
      } catch (error) {
        console.error("Error checking submission status:", error);
        setCanSubmit(false);
        setErrorMessage("Unable to check submission status.");
      }
    };

    checkSubmissionStatus();
  }, [planHistory, upcomingMonday]);

  // Auto-select all sections for each grade the teacher teaches
  useEffect(() => {
    const allKeys: string[] = [];
    Object.keys(groupedAssignments).forEach(grade => {
      groupedAssignments[grade].forEach(asgn => {
        allKeys.push(`${grade}-${asgn.section}-${asgn.subject}`);
      });
    });
    setSelectedKeys(allKeys);
  }, [groupedAssignments]);

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleGrade = (grade: string) => {
    const keys = groupedAssignments[grade].map(a => `${grade}-${a.section}-${a.subject}`);
    const allSelected = keys.every(k => selectedKeys.includes(k));
    setSelectedKeys(prev => allSelected ? prev.filter(k => !keys.includes(k)) : Array.from(new Set([...prev, ...keys])));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!isOnline) {
      alert("✗ You are offline. Please check your internet connection.");
      return;
    }
    
    if (!canSubmit) {
      alert(errorMessage || "Submission is not permitted at this time.");
      return;
    }
    
    if (selectedKeys.length === 0) {
      alert("Please select at least one class-section.");
      return;
    }

    if (isFutureWeek(upcomingMonday)) {
      alert("Submission for future weeks is not permitted.");
      return;
    }

    if (!formData.chapter.trim()) {
      alert("Please enter the chapter name/number.");
      return;
    }

    if (!formData.topics.trim()) {
      alert("Please enter the topics to be covered.");
      return;
    }

    setIsSubmitting(true);
    
    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(false);
      alert("Submission timeout. Please try again.");
    }, 20000);
    
    setSubmissionTimeout(timeoutId);

    try {
      const plans = selectedKeys.map(key => {
        const [className, section, subject] = key.split('-');
        return {
          teacherId: teacher.email,
          className: className as ClassName,
          section: section as any,
          subject,
          weekStarting: upcomingMonday.toISOString(),
          chapter: formData.chapter.trim(),  // Chapter name/number
          topics: formData.topics.trim(),    // Topics to be covered
          homework: formData.homework.trim(), // Homework assignments
          // Removed all other fields
          objectives: '',
          activities: '',
          resources: '',
          assessment: '',
          status: 'submitted',
          resubmissionStatus: existingSubmission?.resubmissionStatus === 'approved' ? 'resubmitted' : 'none' as const
        };
      });

      await APIService.submitMultipleLessonPlans(plans);
      
      clearTimeout(timeoutId);
      
      setSubmittedThisWeek(true);
      setCanSubmit(false);
      setFormData({ 
        chapter: '', 
        topics: '', 
        homework: '' 
      });
      setSuccessMessage("Lesson plans submitted successfully!");
      
      await onRefresh();
      
      alert("✓ Lesson plans submitted successfully!\n\nAn email confirmation has been sent to your registered email.");
    } catch (err: any) {
      console.error("Submission error:", err);
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (err.message?.includes('Failed to submit')) {
        alert(`✗ Submission Failed: ${err.message}`);
      } else {
        alert("✗ An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
        setSubmissionTimeout(null);
      }
    }
  };

  const handleRequestModification = async () => {
    if (!isOnline) {
      alert("✗ You are offline. Please check your internet connection.");
      return;
    }

    if (selectedKeys.length === 0) {
      alert("Please select the classes you want to modify.");
      return;
    }

    const classSections = selectedKeys.map(key => {
      const [className, section, subject] = key.split('-');
      return { className, section, subject };
    });

    const confirmation = confirm(
      `REQUEST MODIFICATION FOR ${classSections.length} CLASS${classSections.length > 1 ? 'ES' : ''}\n\nWeek: ${weekRange}\n\nThis will:\n1. Send request to admin for approval\n2. Allow resubmission after approval\n3. Notify you via email\n\nProceed?`
    );

    if (!confirmation) return;

    setIsRequestingModification(true);
    try {
      const requestId = await APIService.requestResubmission(
        teacher.email,
        upcomingMonday.toISOString(),
        classSections
      );
      
      alert(`✅ Modification request submitted!\n\nRequest ID: ${requestId}\n\nYou will receive email notifications for approval status.`);
      await onRefresh();
      setIsRequestingModification(false);
    } catch (err: any) {
      alert(`✗ Request failed: ${err.message}`);
      setIsRequestingModification(false);
    }
  };

  if (submittedThisWeek && !showHistory) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95">
        <div className="relative inline-flex mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur-xl opacity-50"></div>
          <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-[2.5rem] shadow-2xl">
            <CheckCircle2 className="h-20 w-20 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-black italic bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent mb-6">
          Submission Successfully Processed
        </h2>
        <p className="text-gray-400 text-lg mb-8">Your weekly lesson plans have been submitted for administrative review.</p>
        
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8 mb-10 max-w-md mx-auto backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-amber-300 text-lg font-bold mb-3">Submission Policy</p>
              <ul className="text-amber-400/80 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Only one submission permitted per week
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  No future week submissions allowed
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  For modifications, use "Request Modification"
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Contact administration for exceptional cases
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-12">A digital confirmation has been dispatched to your registered institutional email address.</p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button 
            onClick={() => setShowHistory(true)}
            className="px-10 py-5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <History className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            View Submission History
          </button>
          <button 
            onClick={handleRequestModification}
            disabled={isRequestingModification || !isOnline}
            className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:from-amber-500 hover:to-orange-500 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isRequestingModification ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Edit3 className="h-5 w-5" />
            )}
            Request Modification
          </button>
        </div>
      </div>
    );
  }

  // [Rest of the history view component remains the same...]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Main Form - Takes 2/3 width */}
      <div className="lg:col-span-2 space-y-10">
        <div className="bg-gray-800/50 backdrop-blur-xl p-10 rounded-3xl border border-gray-700/50 shadow-2xl space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Weekly Lesson Plan
              </h3>
              <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">{weekRange}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-sm font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isOnline ? (
                  <>
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-rose-400 rounded-full animate-pulse"></div>
                    <span>Offline</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowSubmissionInfo(!showSubmissionInfo)}
                className="p-2.5 text-gray-400 hover:text-indigo-400 rounded-xl hover:bg-gray-700/50 transition-colors"
              >
                <Info className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 rounded-xl text-sm font-black uppercase text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <History className="h-4 w-4" />
                History
              </button>
            </div>
          </div>

          {showSubmissionInfo && (
            <div className="p-6 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/30 rounded-2xl">
              <div className="flex items-start gap-4">
                <Rocket className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-indigo-300 text-sm font-bold mb-2">Submission Guidelines</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-indigo-400 mt-0.5" />
                      <span className="text-indigo-400/80 text-sm">One submission per week per class-section</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5" />
                      <span className="text-indigo-400/80 text-sm">All relevant sections are auto-selected</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-indigo-400 mt-0.5" />
                      <span className="text-indigo-400/80 text-sm">Modifications require approval</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Bell className="h-4 w-4 text-indigo-400 mt-0.5" />
                      <span className="text-indigo-400/80 text-sm">Email notifications for all actions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isOnline && (
            <div className="p-6 bg-gradient-to-r from-rose-600/10 to-pink-600/10 border border-rose-500/30 rounded-2xl">
              <div className="flex items-start gap-4">
                <WifiOff className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-300 text-sm font-bold mb-1">You are offline</p>
                  <p className="text-rose-400/80 text-sm">Please check your internet connection to submit lesson plans.</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-6 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-top">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-300 text-sm font-bold mb-1">Success!</p>
                  <p className="text-emerald-400/80 text-sm">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {!canSubmit && errorMessage ? (
            <div className="p-6 bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/30 rounded-2xl">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-300 text-sm font-bold mb-1">Submission Restriction</p>
                  <p className="text-amber-400/80 text-sm mb-3">{errorMessage}</p>
                  {existingSubmission && existingSubmission.resubmissionStatus === 'none' && (
                    <button
                      onClick={handleRequestModification}
                      className="text-xs font-black text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="h-3 w-3" />
                      Request Modification
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Class Selection Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black uppercase text-gray-400 tracking-widest">
                  Teaching Assignments
                </label>
                <div className="text-xs text-gray-400 font-bold bg-gray-900/50 px-3 py-1.5 rounded-lg">
                  {selectedKeys.length} of {Object.values(groupedAssignments).flat().length} selected
                </div>
              </div>
              
              {Object.keys(groupedAssignments).sort().map(grade => {
                const gradeKeys = groupedAssignments[grade].map(a => `${grade}-${a.section}-${a.subject}`);
                const allSelected = gradeKeys.every(k => selectedKeys.includes(k));
                const someSelected = gradeKeys.some(k => selectedKeys.includes(k));
                
                return (
                  <div key={grade} className="p-6 bg-gray-900/30 rounded-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                      <span className="text-sm font-black uppercase text-gray-300 flex items-center gap-3">
                        <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${allSelected || someSelected ? 'rotate-90 text-indigo-400' : 'text-gray-500'}`} />
                        Grade {grade}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400">
                          {gradeKeys.filter(k => selectedKeys.includes(k)).length}/{gradeKeys.length}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => toggleGrade(grade)}
                          className="text-xs font-black text-indigo-400 uppercase hover:text-indigo-300 hover:underline"
                          disabled={!canSubmit || isSubmitting}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupedAssignments[grade].map((asgn, i) => {
                        const key = `${grade}-${asgn.section}-${asgn.subject}`;
                        const active = selectedKeys.includes(key);
                        return (
                          <button 
                            key={i} 
                            type="button" 
                            onClick={() => toggleKey(key)}
                            disabled={!canSubmit || isSubmitting}
                            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${active ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/50 text-white' : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-600'} ${(!canSubmit || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                          >
                            {active ? (
                              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                <CheckSquare className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-800 rounded-lg">
                                <Square className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-bold uppercase block mb-1">{asgn.subject}</span>
                              <div className="text-xs text-gray-500">Section {asgn.section}</div>
                            </div>
                            {active && <Sparkles className="h-4 w-4 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lesson Plan Details - Only 3 fields now */}
            <div className="space-y-6 pt-8 border-t border-gray-700/50">
              <h4 className="text-lg font-black text-white mb-6">Lesson Plan Details</h4>
              
              {/* Chapter Name/Number */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative">
                  <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    required 
                    placeholder="Chapter Name / Number" 
                    className="w-full pl-12 pr-6 py-4 bg-gray-900/70 border border-gray-700 rounded-2xl font-bold text-white placeholder-gray-400 outline-none focus:border-indigo-500 text-sm disabled:bg-gray-900 disabled:cursor-not-allowed backdrop-blur-sm"
                    value={formData.chapter} 
                    onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                    disabled={!canSubmit || isSubmitting}
                  />
                </div>
              </div>

              {/* Topics to be Covered */}
              <div>
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 block">Topics to be Covered</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Topics to be covered (one per line)" 
                  className="w-full px-5 py-4 bg-gray-900/70 border border-gray-700 rounded-2xl font-bold text-white placeholder-gray-400 outline-none focus:border-indigo-500 text-sm resize-none disabled:bg-gray-900 disabled:cursor-not-allowed backdrop-blur-sm"
                  value={formData.topics} 
                  onChange={e => setFormData({ ...formData, topics: e.target.value })}
                  disabled={!canSubmit || isSubmitting}
                />
              </div>

              {/* Homework Assignments */}
              <div>
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 block">Homework Assignments</label>
                <textarea 
                  rows={3}
                  placeholder="Homework assignments" 
                  className="w-full px-5 py-4 bg-gray-900/70 border border-gray-700 rounded-2xl font-bold text-white placeholder-gray-400 outline-none focus:border-indigo-500 text-sm resize-none disabled:bg-gray-900 disabled:cursor-not-allowed backdrop-blur-sm"
                  value={formData.homework} 
                  onChange={e => setFormData({ ...formData, homework: e.target.value })}
                  disabled={!canSubmit || isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-8 border-t border-gray-700/50">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !canSubmit || selectedKeys.length === 0 || !isOnline} 
                  className="relative w-full bg-gradient-to-r from-indigo-700 to-purple-700 text-white font-black py-5 rounded-2xl shadow-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 relative z-10">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing Submission...
                      </>
                    ) : !isOnline ? (
                      <>
                        <WifiOff className="h-5 w-5" />
                        Offline - Cannot Submit
                      </>
                    ) : !canSubmit ? (
                      <>
                        <AlertTriangle className="h-5 w-5" />
                        Submission Restricted
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit Lesson Plans
                      </>
                    )}
                  </div>
                  {isSubmitting && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse w-full rounded-b-2xl"></div>
                  )}
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  This submission will apply to {selectedKeys.length} selected class-section{selectedKeys.length !== 1 ? 's' : ''}.
                </p>
                {!isOnline && (
                  <p className="text-sm text-rose-400 font-bold mt-3">
                    You are offline. Please connect to the internet to submit.
                  </p>
                )}
                {!canSubmit && (
                  <p className="text-sm text-amber-400 font-bold mt-3">
                    Submission not permitted. Please review restrictions above.
                  </p>
                )}
                {isSubmitting && (
                  <p className="text-sm text-indigo-400 font-bold mt-3 animate-pulse">
                    Please wait while your submission is being processed...
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modification Request Section */}
        <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 backdrop-blur-xl p-8 rounded-3xl border border-amber-500/30 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <AlertOctagon className="h-8 w-8 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-amber-300 mb-2">Need to Make Changes?</h3>
              <p className="text-amber-400/80 text-sm">
                Request modification for submitted lesson plans
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="text-sm font-bold text-amber-300 mb-2">How it works:</div>
              <ol className="text-amber-400/80 text-sm space-y-2 pl-5">
                <li className="list-decimal">Select classes to modify above</li>
                <li className="list-decimal">Click "Request Modification"</li>
                <li className="list-decimal">Admin reviews and approves</li>
                <li className="list-decimal">You receive email notification</li>
                <li className="list-decimal">Resubmit with changes</li>
              </ol>
            </div>
            
            <button
              onClick={handleRequestModification}
              disabled={isRequestingModification || !isOnline || selectedKeys.length === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:from-amber-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isRequestingModification ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Edit3 className="h-5 w-5" />
              )}
              {isRequestingModification ? 'Processing Request...' : 'Request Modification'}
            </button>
            
            <p className="text-xs text-amber-500/60 text-center">
              Note: Modification requests require administrative approval before resubmission.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar - Takes 1/3 width */}
      <div className="space-y-8">
        {/* Stats Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
          <h3 className="text-xl font-black uppercase italic text-white mb-6">Submission Statistics</h3>
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl border border-indigo-500/30">
              <div className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-2">Current Academic Week</div>
              <div className="text-2xl font-black text-white mb-2">{weekLabel}</div>
              <div className="text-sm text-indigo-300 font-bold">
                {formatDate(upcomingMonday)} - {formatDate(nextSaturday)}
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-black uppercase text-gray-400 tracking-widest">Total Submissions</div>
                <div className={`text-xs font-black ${existingSubmission ? 'text-emerald-400' : 'text-amber-400'} bg-gray-800 px-2 py-1 rounded-lg`}>
                  {existingSubmission ? 'Submitted' : 'Pending'}
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-2">{planHistory.length}</div>
              <div className="text-sm text-gray-400">
                Across {Object.keys(groupedAssignments).length} grade{Object.keys(groupedAssignments).length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-2xl border border-emerald-500/30">
              <div className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-2">Teaching Load</div>
              <div className="space-y-3">
                {Object.keys(groupedAssignments).sort().map(grade => (
                  <div key={grade} className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-300">Grade {grade}</span>
                    <span className="text-xs font-black text-emerald-200 bg-emerald-500/10 px-3 py-1 rounded-lg">
                      {groupedAssignments[grade].length} section{groupedAssignments[grade].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
          <h3 className="text-xl font-black uppercase italic text-white mb-6">Recent Submissions</h3>
          <div className="space-y-4">
            {planHistory.slice(0, 4).map(plan => (
              <div key={plan.id} className="p-4 bg-gray-900/30 rounded-2xl border border-gray-700 hover:bg-gray-800/50 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1 rounded-lg">
                      {plan.className}-{plan.section}
                    </span>
                    <div className="text-xs text-gray-400 font-bold mt-2">{plan.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-gray-400">
                      {new Date(plan.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold">
                      {plan.weekLabel}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-white truncate mb-2" title={plan.chapter}>
                  {plan.chapter}
                </div>
                <div className="mt-2">
                  {plan.resubmissionStatus === 'pending' ? (
                    <span className="text-xs font-black bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg">
                      Modification Pending
                    </span>
                  ) : plan.resubmissionStatus === 'approved' ? (
                    <span className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-lg">
                      Approved for Resubmission
                    </span>
                  ) : plan.resubmissionStatus === 'resubmitted' ? (
                    <span className="text-xs font-black bg-blue-500/10 text-blue-300 px-2 py-1 rounded-lg">
                      Resubmitted
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            
            {planHistory.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-2xl">
                <BookOpen className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-sm">No submissions yet</p>
                <p className="text-gray-500 text-xs mt-1">Submit your first lesson plan</p>
              </div>
            )}
            
            {planHistory.length > 4 && (
              <button
                onClick={() => setShowHistory(true)}
                className="w-full py-3 text-center text-sm font-bold text-indigo-400 hover:text-indigo-300 border border-dashed border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
              >
                View All {planHistory.length} Submissions →
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-700/50 shadow-2xl">
          <h4 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="w-full p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-3 group"
            >
              <FileText className="h-4 w-4 text-gray-400 group-hover:text-indigo-400" />
              <span className="text-sm font-bold text-gray-300 group-hover:text-white">Print Preview</span>
            </button>
            
            <button
              onClick={onRefresh}
              className="w-full p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-3 group"
            >
              <RefreshCw className="h-4 w-4 text-gray-400 group-hover:text-emerald-400" />
              <span className="text-sm font-bold text-gray-300 group-hover:text-white">Refresh Data</span>
            </button>
            
            <button
              onClick={() => setShowHistory(true)}
              className="w-full p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-3 group"
            >
              <History className="h-4 w-4 text-gray-400 group-hover:text-amber-400" />
              <span className="text-sm font-bold text-gray-300 group-hover:text-white">View History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
