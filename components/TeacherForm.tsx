import React, { useState, useEffect } from 'react';
import { 
  Loader2, Send, BookOpen, CheckCircle2, CheckSquare, Square, 
  Layers, ChevronRight, AlertCircle, History, AlertTriangle, 
  Clock, Info, Calendar, Mail, User, Check, Wifi, WifiOff
} from 'lucide-react';
import { Teacher, LessonPlan, ClassName } from '../types';
import { APIService } from '../services/api';
import { getUpcomingMonday, formatDate, getNextSaturday, getWeekLabel, isFutureWeek, getWeekRangeLabel } from '../utils';

interface TeacherFormProps {
  teacher: Teacher;
  history: LessonPlan[];
  onRefresh: () => Promise<void>;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history: planHistory, onRefresh }) => {
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submissionTimeout, setSubmissionTimeout] = useState<number | null>(null);
// FIXED: NodeJS.Timeout is invalid in browser environment
  const [formData, setFormData] = useState({ chapter: '', topics: '', homework: '' });
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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
        const submission = planHistory.find(plan => 
          plan.weekStarting === currentWeekStart
        );
        
        if (submission) {
          setExistingSubmission(submission);
          
          if (isFutureWeek(upcomingMonday)) {
            setCanSubmit(false);
            setErrorMessage("Submission for future weeks is not permitted. You may only submit lesson plans for the upcoming academic week starting Monday.");
            return;
          }
          
          if (submission.resubmissionStatus === 'none') {
            setSubmittedThisWeek(true);
            setCanSubmit(false);
            setErrorMessage("");
          } else if (submission.resubmissionStatus === 'pending') {
            setCanSubmit(false);
            setErrorMessage("A modification request is currently pending approval from the administration. Please await administrative approval before attempting to resubmit.");
          } else if (submission.resubmissionStatus === 'approved') {
            setCanSubmit(true);
            setSubmittedThisWeek(false);
            setErrorMessage("");
          } else if (submission.resubmissionStatus === 'resubmitted') {
            setSubmittedThisWeek(true);
            setCanSubmit(false);
            setErrorMessage("You have already resubmitted your lesson plan for this week. No further modifications are permitted.");
          }
        } else {
          if (isFutureWeek(upcomingMonday)) {
            setCanSubmit(false);
            setErrorMessage("Submission for future weeks is not permitted. You may only submit lesson plans for the upcoming academic week starting Monday.");
            return;
          }
          
          setCanSubmit(true);
          setSubmittedThisWeek(false);
          setErrorMessage("");
        }
      } catch (error) {
        console.error("Error checking submission status:", error);
        setCanSubmit(false);
        setErrorMessage("Unable to check submission status. Please try refreshing the page.");
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
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');
    
    // Check if online
    if (!isOnline) {
      alert("✗ You are offline. Please check your internet connection and try again.");
      return;
    }
    
    if (!canSubmit) {
      const alertMsg = errorMessage || "Submission is not permitted at this time. Please review the status of your existing submission.";
      alert(alertMsg);
      return;
    }
    
    if (selectedKeys.length === 0) {
      alert("Please select at least one class-section to submit lesson plans for.");
      return;
    }

    if (isFutureWeek(upcomingMonday)) {
      alert("Submission for future weeks is not permitted. You may only submit lesson plans for the upcoming academic week.");
      return;
    }

    // Validate form data
    if (!formData.chapter.trim()) {
      alert("Please enter the chapter name/number.");
      return;
    }

    if (!formData.topics.trim()) {
      alert("Please enter the topics to be covered.");
      return;
    }

    if (!formData.homework.trim()) {
      alert("Please enter the homework assignments.");
      return;
    }

    setIsSubmitting(true);
    
    // Set timeout to prevent infinite spinner (20 seconds)
    const timeoutId = window.setTimeout(() => {
      setIsSubmitting(false);
      if (submissionTimeout) clearTimeout(submissionTimeout);
      alert("Submission is taking longer than expected. Please check your internet connection and try again. If the problem persists, contact the administration.");
    }, 20000);
    
    setSubmissionTimeout(timeoutId);

    try {
      const plans = selectedKeys.map(key => {
        const [className, section, subject] = key.split('-');
        return {
          teacherId: teacher.email,
          teacherName: teacher.name,
          className: className as ClassName,
          section: section as any,
          subject,
          dateFrom: formatDate(upcomingMonday),
          dateTo: formatDate(nextSaturday),
          chapter: formData.chapter.trim(),
          topics: formData.topics.trim(),
          homework: formData.homework.trim(),
          weekStarting: upcomingMonday.toISOString(),
          weekLabel,
          resubmissionStatus: existingSubmission?.resubmissionStatus === 'approved' ? 'resubmitted' : 'none' as const
        };
      });

      console.log("Submitting plans:", plans.length);
      await APIService.submitMultiplePlans(plans);
      
      // Clear timeout on success
      clearTimeout(timeoutId);
      
      setSubmittedThisWeek(true);
      setCanSubmit(false);
      setFormData({ chapter: '', topics: '', homework: '' });
      setSuccessMessage("Lesson plans submitted successfully!");
      
      // Refresh data
      await onRefresh();
      
      // Show success message
      alert("✓ Lesson plans submitted successfully!\n\nA confirmation email has been dispatched to your registered email address.\n\nNote: You cannot submit additional lesson plans for this week. If modifications are required, please use the 'Request Modification' option.");
    } catch (err: any) {
      console.error("Submission error:", err);
      
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      
      if (err.message?.includes('DUPLICATE_SUBMISSION:')) {
        const errorMsg = err.message.replace('DUPLICATE_SUBMISSION:', '').trim();
        alert(`✗ Submission Failed:\n\n${errorMsg}\n\nIf you need to make changes, please use the "Request Modification" option in your submission history.`);
      } else if (err.message?.includes('Failed to submit')) {
        alert(`✗ Submission Failed:\n\n${err.message}\n\nPlease check your internet connection and try again.`);
      } else if (err.message?.includes('timeout')) {
        alert("✗ Submission timeout. The server is taking too long to respond. Please try again.");
      } else {
        alert("✗ An unexpected error occurred during submission. Please try again. If the problem persists, contact the administration.");
      }
    } finally {
      setIsSubmitting(false);
      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
        setSubmissionTimeout(null);
      }
    }
  };

  const handleRequestResubmission = async (planId: string, weekRange: string) => {
    const confirmationMessage = `REQUEST FOR LESSON PLAN MODIFICATION\n\nWeek: ${weekRange}\n\nAre you certain you wish to request modifications for this submitted lesson plan?\n\nImportant Notes:\n1. This request will be forwarded to the administration for approval.\n2. You will receive an email notification upon administrative approval.\n3. Only after approval may you resubmit your lesson plan.\n4. Pending requests cannot be cancelled.\n\nProceed with modification request?`;
    
    if (!confirm(confirmationMessage)) return;
    
    try {
      await APIService.requestResubmission(planId, teacher.email, teacher.name, weekRange);
      alert("✓ Modification request has been successfully transmitted to the administration.\n\nYou will receive an email notification once your request receives administrative approval.\n\nPlease await approval before attempting to resubmit.");
      await onRefresh();
    } catch (err) {
      alert("✗ Failed to transmit modification request. Please attempt again later.");
    }
  };

  if (submittedThisWeek && !showHistory) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95">
        <div className="inline-flex p-6 bg-emerald-50 rounded-[2.5rem] mb-8">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">Submission Successfully Processed</h2>
        <p className="text-slate-500 text-sm mb-6">Your weekly lesson plans have been successfully submitted for administrative review.</p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-amber-700 text-sm font-bold mb-1">Submission Policy Reminder</p>
              <p className="text-amber-600 text-xs">
                ✓ Only one submission permitted per week<br/>
                ✓ No future week submissions allowed<br/>
                ✓ For modifications, use "Request Modification"<br/>
                ✓ Contact administration for exceptional cases
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-10">A digital confirmation has been dispatched to your registered institutional email address.</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setShowHistory(true)}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center"
          >
            <History className="h-4 w-4 mr-2" />
            View Submission History
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
          >
            Submit for Different Week
          </button>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Submission History Archive</h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">Chronological Record of Lesson Plan Submissions</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowHistory(false)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
            >
              ← Return to Submission Form
            </button>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Total Submissions</div>
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{planHistory.length}</div>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Current Week Status</div>
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                {existingSubmission ? 'Submitted' : 'Pending'}
              </div>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Modification Requests</div>
                <AlertCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900">
                {planHistory.filter(p => p.resubmissionStatus === 'pending' || p.resubmissionStatus === 'approved').length}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Academic Week</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Class & Section</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Subject</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Chapter</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Submission Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {planHistory.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-4">
                      <div className="text-[10px] font-bold text-slate-900">{plan.weekLabel}</div>
                      <div className="text-[8px] text-slate-400">
                        {new Date(plan.submittedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-[7px] text-slate-300 font-bold">
                        {new Date(plan.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded">
                        {plan.className}-{plan.section}
                      </span>
                    </td>
                    <td className="py-5 px-4 font-bold text-sm">{plan.subject}</td>
                    <td className="py-5 px-4 text-sm max-w-xs truncate">{plan.chapter}</td>
                    <td className="py-5 px-4">
                      {plan.resubmissionStatus === 'pending' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black bg-yellow-50 text-yellow-600 px-2 py-1 rounded uppercase">
                            Modification Pending
                          </span>
                          <span className="text-[7px] text-yellow-500">Awaiting Admin Approval</span>
                        </div>
                      ) : plan.resubmissionStatus === 'approved' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase">
                            Modification Approved
                          </span>
                          <span className="text-[7px] text-emerald-500">You may resubmit</span>
                        </div>
                      ) : plan.resubmissionStatus === 'resubmitted' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">
                            Resubmitted
                          </span>
                          <span className="text-[7px] text-blue-500">Modification applied</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">
                            Submitted
                          </span>
                          <span className="text-[7px] text-slate-400">Awaiting review</span>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-4">
                      {plan.resubmissionStatus === 'none' && (
                        <button
                          onClick={() => handleRequestResubmission(plan.id, plan.weekLabel || plan.weekStarting)}
                          className="text-[8px] font-black text-rose-600 hover:text-rose-700 uppercase bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-rose-50"
                          title="Request modification for this submission"
                        >
                          Request Modification
                        </button>
                      )}
                      {plan.resubmissionStatus === 'pending' && (
                        <span className="text-[8px] font-black text-yellow-600 uppercase bg-yellow-50 px-3 py-1.5 rounded-lg">
                          Request Sent
                        </span>
                      )}
                      {plan.resubmissionStatus === 'approved' && (
                        <button
                          onClick={() => {
                            setShowHistory(false);
                            window.scrollTo(0, 0);
                          }}
                          className="text-[8px] font-black text-emerald-600 hover:text-emerald-700 uppercase bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                          title="Resubmit your lesson plan"
                        >
                          Resubmit Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {planHistory.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold mb-2">No submission history available</p>
                <p className="text-[10px] text-slate-300">Submit your first lesson plan to begin tracking</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-800 font-black text-sm mb-2">Submission Policy Guidelines</h4>
              <ul className="text-amber-700 text-xs space-y-1">
                <li className="flex items-start gap-2">
                  <span className="font-black">•</span>
                  <span>Only one submission permitted per academic week per class-section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black">•</span>
                  <span>Future week submissions are strictly prohibited</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black">•</span>
                  <span>Modifications require administrative approval via "Request Modification"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black">•</span>
                  <span>Resubmission is permitted only after administrative approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black">•</span>
                  <span>Contact school administration for exceptional circumstances</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-left">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Weekly Lesson Plan Submission</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">{weekRange}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button
              onClick={() => setShowSubmissionInfo(!showSubmissionInfo)}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors"
              title="Submission guidelines"
            >
              <Info className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <History className="h-3 w-3" />
              History
            </button>
          </div>
        </div>

        {showSubmissionInfo && (
          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-indigo-800 text-sm font-bold mb-1">Submission Guidelines</p>
                <ul className="text-indigo-700 text-xs space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="font-black">•</span>
                    <span>One submission per week per class-section combination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black">•</span>
                    <span>All relevant class-sections are auto-selected by default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black">•</span>
                    <span>Modifications require administrative approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-black">•</span>
                    <span>Contact administration for policy exceptions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-700 text-sm font-bold mb-1">You are offline</p>
                <p className="text-rose-600 text-xs">Please check your internet connection to submit lesson plans.</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-700 text-sm font-bold mb-1">Success!</p>
                <p className="text-emerald-600 text-xs">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {!canSubmit && errorMessage ? (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-700 text-sm font-bold mb-1">Submission Restriction Active</p>
                <p className="text-rose-600 text-xs mb-2">{errorMessage}</p>
                {existingSubmission && existingSubmission.resubmissionStatus === 'none' && (
                  <button
                    onClick={() => handleRequestResubmission(existingSubmission.id, existingSubmission.weekLabel || existingSubmission.weekStarting)}
                    className="text-[10px] font-black text-rose-700 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Request Modification
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Teaching Assignments
              </label>
              <div className="text-[9px] text-slate-400 font-bold">
                {selectedKeys.length} of {Object.values(groupedAssignments).flat().length} selected
              </div>
            </div>
            {Object.keys(groupedAssignments).sort().map(grade => {
              const gradeKeys = groupedAssignments[grade].map(a => `${grade}-${a.section}-${a.subject}`);
              const allSelected = gradeKeys.every(k => selectedKeys.includes(k));
              const someSelected = gradeKeys.some(k => selectedKeys.includes(k));
              
              return (
                <div key={grade} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2">
                      <ChevronRight className={`h-3 w-3 ${allSelected ? 'text-indigo-600' : someSelected ? 'text-indigo-400' : 'text-slate-400'} transition-transform ${allSelected || someSelected ? 'rotate-90' : ''}`} />
                      Grade {grade}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400">
                        {gradeKeys.filter(k => selectedKeys.includes(k)).length}/{gradeKeys.length}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => toggleGrade(grade)}
                        className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groupedAssignments[grade].map((asgn, i) => {
                      const key = `${grade}-${asgn.section}-${asgn.subject}`;
                      const active = selectedKeys.includes(key);
                      return (
                        <button 
                          key={i} 
                          type="button" 
                          onClick={() => toggleKey(key)}
                          disabled={!canSubmit || isSubmitting}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${active ? 'bg-white border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400'} ${(!canSubmit || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'}`}
                        >
                          {active ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase truncate block">{asgn.subject}</span>
                            <div className="text-[8px] text-slate-400">Section {asgn.section}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="relative">
              <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                required 
                placeholder="Chapter Name / Number" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" 
                value={formData.chapter} 
                onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                disabled={!canSubmit || isSubmitting}
              />
            </div>
            <textarea 
              required 
              rows={3} 
              placeholder="Topics to be covered (one per line)" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none disabled:bg-slate-100 disabled:cursor-not-allowed" 
              value={formData.topics} 
              onChange={e => setFormData({ ...formData, topics: e.target.value })}
              disabled={!canSubmit || isSubmitting}
            />
            <textarea 
              required 
              rows={2} 
              placeholder="Homework Assignments (for all selected classes)" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none disabled:bg-slate-100 disabled:cursor-not-allowed" 
              value={formData.homework} 
              onChange={e => setFormData({ ...formData, homework: e.target.value })}
              disabled={!canSubmit || isSubmitting}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSubmitting || !canSubmit || selectedKeys.length === 0 || !isOnline} 
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <div className="flex items-center gap-3 relative z-10">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Submission...
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="h-4 w-4" />
                    Offline - Cannot Submit
                  </>
                ) : !canSubmit ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Submission Restricted
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Lesson Plans
                  </>
                )}
              </div>
              {isSubmitting && (
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-400 animate-pulse w-full"></div>
              )}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-[10px] text-slate-400">
                Note: This submission will apply to {selectedKeys.length} selected class-section{selectedKeys.length !== 1 ? 's' : ''}.
              </p>
              {!isOnline && (
                <p className="text-[10px] text-rose-400 font-bold mt-2">
                  You are offline. Please connect to the internet to submit.
                </p>
              )}
              {!canSubmit && (
                <p className="text-[10px] text-rose-400 font-bold mt-2">
                  Submission not permitted. Please review restrictions above.
                </p>
              )}
              {isSubmitting && (
                <p className="text-[10px] text-indigo-400 font-bold mt-2 animate-pulse">
                  Please wait while your submission is being processed...
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm animate-in slide-in-from-right">
          <h3 className="text-xl font-black uppercase italic tracking-tight mb-6">Submission Statistics</h3>
          <div className="space-y-6">
            <div className="p-5 bg-indigo-50 rounded-2xl">
              <div className="text-[8px] font-black uppercase text-indigo-600 tracking-widest mb-2">Current Academic Week</div>
              <div className="text-2xl font-black text-indigo-900">{weekLabel}</div>
              <div className="text-[10px] text-indigo-500 font-bold mt-2">
                {formatDate(upcomingMonday)} - {formatDate(nextSaturday)}
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Total Submissions</div>
                <div className={`text-[8px] font-black ${existingSubmission ? 'text-emerald-600' : 'text-amber-600'} bg-white px-2 py-0.5 rounded`}>
                  {existingSubmission ? 'Submitted' : 'Pending'}
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{planHistory.length}</div>
              <div className="text-[10px] text-slate-400 mt-2">
                Across {Object.keys(groupedAssignments).length} grade{Object.keys(groupedAssignments).length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="p-5 bg-emerald-50 rounded-2xl">
              <div className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-2">Teaching Load</div>
              <div className="space-y-2">
                {Object.keys(groupedAssignments).sort().map(grade => (
                  <div key={grade} className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-900">Grade {grade}</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {groupedAssignments[grade].length} section{groupedAssignments[grade].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black uppercase italic tracking-tight mb-6">Recent Submissions</h3>
          <div className="space-y-4">
            {planHistory.slice(0, 3).map(plan => (
              <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded">
                      {plan.className}-{plan.section}
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">{plan.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-slate-400">
                      {new Date(plan.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[7px] text-slate-300 font-bold">
                      {plan.weekLabel}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold truncate" title={plan.chapter}>
                  {plan.chapter}
                </div>
                <div className="mt-2">
                  {plan.resubmissionStatus === 'pending' ? (
                    <span className="text-[7px] font-black bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded">
                      Modification Pending
                    </span>
                  ) : plan.resubmissionStatus === 'approved' ? (
                    <span className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                      Approved for Resubmission
                    </span>
                  ) : plan.resubmissionStatus === 'resubmitted' ? (
                    <span className="text-[7px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      Resubmitted
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            
            {planHistory.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-bold text-sm">No submissions yet</p>
              </div>
            )}
            
            {planHistory.length > 3 && (
              <button
                onClick={() => setShowHistory(true)}
                className="w-full text-center py-3 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                View All {planHistory.length} Submissions →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
