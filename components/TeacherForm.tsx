
import React, { useState } from 'react';
import { Loader2, RefreshCcw, Send, ClipboardList, BookOpen, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { Teacher, LessonPlan, ClassName, SectionName } from '../types';
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
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [submittedThisWeek, setSubmittedThisWeek] = useState(false);

  // Flatten assignments into individual class-section-subject options
  const assignmentOptions = teacher.assignments.flatMap((asgn, asgnIdx) => 
    asgn.sections.map(sec => ({
      id: `${asgnIdx}-${sec}`,
      className: asgn.className,
      section: sec,
      subject: asgn.subject,
      label: `${asgn.subject} (Class ${asgn.className}-${sec})`
    }))
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    chapter: '',
    topics: '',
    homework: ''
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === assignmentOptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assignmentOptions.map(opt => opt.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("Please select at least one class/section.");
      return;
    }

    setIsSubmitting(true);
    try {
      const plansToSubmit = selectedIds.map(id => {
        const option = assignmentOptions.find(o => o.id === id)!;
        return {
          teacherId: teacher.email, // using email as ID consistency
          teacherName: teacher.name,
          className: option.className,
          section: option.section,
          subject: option.subject,
          dateFrom: formatDate(upcomingMonday),
          dateTo: formatDate(nextSaturday),
          chapter: formData.chapter,
          topics: formData.topics,
          homework: formData.homework,
          weekStarting: upcomingMonday.toISOString(),
          weekLabel: weekLabel,
          resubmissionStatus: 'none' as const
        };
      });

      await APIService.submitMultiplePlans(plansToSubmit);
      
      setSubmittedThisWeek(true);
      // Reset form
      setFormData({ chapter: '', topics: '', homework: '' });
      setSelectedIds([]);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedThisWeek) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="inline-flex p-6 bg-emerald-50 rounded-[2.5rem] mb-8">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Submission Complete</h2>
        <p className="text-slate-500 font-medium mb-10">Your lesson plans for {weekLabel} have been securely logged.</p>
        <button onClick={() => setSubmittedThisWeek(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      {/* Submission Form */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">New Weekly Plan</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">{weekLabel}</p>
          </div>
          <ClipboardList className="h-6 w-6 text-slate-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Target Classes & Sections</label>
              <button 
                type="button" 
                onClick={selectAll}
                className="text-[9px] font-black uppercase text-indigo-600 hover:underline"
              >
                {selectedIds.length === assignmentOptions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
              {assignmentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleSelection(opt.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedIds.includes(opt.id) 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {selectedIds.includes(opt.id) ? (
                    <CheckSquare className="h-4 w-4 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-[10px] font-black uppercase truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Chapter Name / Number</label>
            <div className="relative">
              <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                required
                placeholder="e.g., Chapter 4: Fractions"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                value={formData.chapter}
                onChange={e => setFormData({ ...formData, chapter: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Topics to be Covered</label>
            <textarea 
              required
              rows={3}
              placeholder="List specific topics or page numbers..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all resize-none"
              value={formData.topics}
              onChange={e => setFormData({ ...formData, topics: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Homework Assignments</label>
            <textarea 
              required
              rows={2}
              placeholder="Exercises, projects, or self-study tasks..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all resize-none"
              value={formData.homework}
              onChange={e => setFormData({ ...formData, homework: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Finalize Submission</>}
          </button>
        </form>
      </div>

      {/* History Side Panel */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black uppercase italic tracking-tight mb-6">Recent Records</h3>
          
          <div className="space-y-3">
            {planHistory.length > 0 ? planHistory.map(plan => (
              <div key={plan.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-indigo-100 transition-all">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-[8px] font-black bg-white border border-slate-200 text-indigo-600 px-2 py-0.5 rounded uppercase">{plan.className}-{plan.section}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{plan.weekLabel}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 italic">{plan.subject}: {plan.chapter}</h4>
                  
                  {plan.resubmissionStatus === 'pending' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest">Waiting for Admin Unlock</span>
                    </div>
                  )}
                </div>
                
                {(!plan.resubmissionStatus || plan.resubmissionStatus === 'none' || plan.resubmissionStatus === 'declined') ? (
                  <button 
                    disabled={isRequesting === plan.id} 
                    onClick={async () => { 
                      if(!confirm("Request Admin to unlock this record for editing?")) return;
                      setIsRequesting(plan.id); 
                      await APIService.requestResubmission(plan, teacher.email); 
                      alert("Request sent. Please wait for approval."); 
                      setIsRequesting(null); 
                    }} 
                    className="shrink-0 text-[9px] font-black uppercase text-indigo-600 border border-indigo-100 bg-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    {isRequesting === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />} 
                    {plan.resubmissionStatus === 'declined' ? 'Retry Edit' : 'Edit Request'}
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100">
                    <Loader2 className="h-3 w-3 animate-spin" /> Pending
                  </div>
                )}
              </div>
            )) : (
              <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">No history found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
