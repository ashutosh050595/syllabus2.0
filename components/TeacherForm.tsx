import React, { useState, useEffect } from 'react';
import { Loader2, Send, BookOpen, CheckCircle2, CheckSquare, Square, Layers, ChevronRight, AlertCircle, History } from 'lucide-react';
import { Teacher, LessonPlan, ClassName } from '../types';
import { APIService } from '../services/api';
import { getUpcomingMonday, formatDate, getNextSaturday, getWeekLabel } from '../utils';

interface TeacherFormProps {
  teacher: Teacher;
  history: LessonPlan[];
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history: planHistory }) => {
  const upcomingMonday = getUpcomingMonday();
  const nextSaturday = getNextSaturday(upcomingMonday);
  const weekLabel = getWeekLabel(upcomingMonday);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedThisWeek, setSubmittedThisWeek] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Check if teacher has already submitted for this week
  useEffect(() => {
    const currentWeekStart = upcomingMonday.toISOString();
    const hasSubmitted = planHistory.some(plan => 
      plan.weekStarting === currentWeekStart && plan.resubmissionStatus !== 'approved'
    );
    setSubmittedThisWeek(hasSubmitted);
  }, [planHistory, upcomingMonday]);

  // Group assignments by Grade
  const groupedAssignments = teacher.assignments.reduce((acc, asgn) => {
    if (!acc[asgn.className]) acc[asgn.className] = [];
    asgn.sections.forEach(sec => {
      acc[asgn.className].push({ section: sec, subject: asgn.subject });
    });
    return acc;
  }, {} as Record<string, { section: string, subject: string }[]>);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [formData, setFormData] = useState({ chapter: '', topics: '', homework: '' });

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
    if (selectedKeys.length === 0) return alert("Select at least one class target.");

    setIsSubmitting(true);
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
          chapter: formData.chapter,
          topics: formData.topics,
          homework: formData.homework,
          weekStarting: upcomingMonday.toISOString(),
          weekLabel,
          resubmissionStatus: 'none' as const
        };
      });

      await APIService.submitMultiplePlans(plans);
      setSubmittedThisWeek(true);
      setFormData({ chapter: '', topics: '', homework: '' });
      alert("Lesson plans submitted successfully! Confirmation email has been sent.");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResubmission = async (planId: string, weekRange: string) => {
    if (!confirm("Are you sure you want to request resubmission for this plan?")) return;
    
    try {
      await APIService.requestResubmission(planId, teacher.email, teacher.name, weekRange);
      alert("Resubmission request sent to admin. You'll receive an email when it's approved.");
    } catch (err) {
      alert("Failed to send resubmission request.");
    }
  };

  if (submittedThisWeek && !showHistory) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95">
        <div className="inline-flex p-6 bg-emerald-50 rounded-[2.5rem] mb-8">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter mb-4">Submission Complete!</h2>
        <p className="text-slate-500 text-sm mb-6">Your weekly lesson plans have been successfully submitted.</p>
        <p className="text-xs text-slate-400 mb-10">A confirmation email has been sent to your registered email address.</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setShowHistory(true)}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
          >
            <History className="h-4 w-4 inline mr-2" />
            View History
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Submission History</h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">Past Lesson Plans</p>
          </div>
          <button 
            onClick={() => setShowHistory(false)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Back to Form
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Week</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Class-Section</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Subject</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Chapter</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {planHistory.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4">
                      <div className="text-[10px] font-bold text-slate-900">{plan.weekLabel}</div>
                      <div className="text-[8px] text-slate-400">{new Date(plan.submittedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-5 px-4">
                      <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded">
                        {plan.className}-{plan.section}
                      </span>
                    </td>
                    <td className="py-5 px-4 font-bold text-sm">{plan.subject}</td>
                    <td className="py-5 px-4 text-sm">{plan.chapter}</td>
                    <td className="py-5 px-4">
                      {plan.resubmissionStatus === 'pending' ? (
                        <span className="text-[8px] font-black bg-yellow-50 text-yellow-600 px-2 py-1 rounded">Pending Approval</span>
                      ) : plan.resubmissionStatus === 'approved' ? (
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Approved</span>
                      ) : (
                        <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded">Submitted</span>
                      )}
                    </td>
                    <td className="py-5 px-4">
                      {plan.resubmissionStatus === 'none' && (
                        <button
                          onClick={() => handleRequestResubmission(plan.id, plan.weekLabel || plan.weekStarting)}
                          className="text-[8px] font-black text-rose-600 hover:text-rose-700 uppercase"
                        >
                          Request Change
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <h3 className="text-xl font-black uppercase italic tracking-tight">Weekly Lesson Plan</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">{weekLabel}</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600"
          >
            <History className="h-3 w-3" />
            History
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Teaching Assignments (All selected by default)
            </label>
            {Object.keys(groupedAssignments).sort().map(grade => (
              <div key={grade} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-indigo-600" /> Grade {grade}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => toggleGrade(grade)}
                    className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                  >
                    {groupedAssignments[grade].every(a => 
                      selectedKeys.includes(`${grade}-${a.section}-${a.subject}`)
                    ) ? 'Deselect All' : 'Select All'}
                  </button>
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
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${active ? 'bg-white border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        {active ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                        <div className="flex-1">
                          <span className="text-[10px] font-bold uppercase truncate">{asgn.subject}</span>
                          <div className="text-[8px] text-slate-400">Section {asgn.section}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="relative">
              <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                required 
                placeholder="Chapter Name / Number" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm" 
                value={formData.chapter} 
                onChange={e => setFormData({ ...formData, chapter: e.target.value })} 
              />
            </div>
            <textarea 
              required 
              rows={3} 
              placeholder="Topics to be covered (one per line)" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none" 
              value={formData.topics} 
              onChange={e => setFormData({ ...formData, topics: e.target.value })}
            />
            <textarea 
              required 
              rows={2} 
              placeholder="Homework Assignments (for all selected classes)" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none" 
              value={formData.homework} 
              onChange={e => setFormData({ ...formData, homework: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Lesson Plans
              </>
            )}
          </button>
          
          <p className="text-[10px] text-slate-400 text-center">
            Note: This will submit the same lesson plan for all selected classes and sections.
            Homework will be assigned to all selected classes.
          </p>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm animate-in slide-in-from-right">
        <h3 className="text-xl font-black uppercase italic tracking-tight mb-6">Quick Stats</h3>
        <div className="space-y-6">
          <div className="p-5 bg-indigo-50 rounded-2xl">
            <div className="text-[8px] font-black uppercase text-indigo-600 tracking-widest mb-2">This Week</div>
            <div className="text-2xl font-black text-indigo-900">{weekLabel}</div>
          </div>
          
          <div className="p-5 bg-slate-50 rounded-2xl">
            <div className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-2">Total Submissions</div>
            <div className="text-3xl font-black text-slate-900">{planHistory.length}</div>
          </div>
          
          <div className="p-5 bg-emerald-50 rounded-2xl">
            <div className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-2">Active Assignments</div>
            <div className="text-lg font-black text-emerald-900">
              {Object.keys(groupedAssignments).map(grade => (
                <div key={grade} className="mb-1">
                  Grade {grade}: {groupedAssignments[grade].length} sections
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
