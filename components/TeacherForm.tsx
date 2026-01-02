
import React, { useState } from 'react';
import { Loader2, Send, ClipboardList, BookOpen, CheckCircle2, CheckSquare, Square, Layers, ChevronRight } from 'lucide-react';
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

  // Group assignments by Grade/Class for the UI
  const groupedAssignments = teacher.assignments.reduce((acc, asgn) => {
    if (!acc[asgn.className]) acc[asgn.className] = [];
    asgn.sections.forEach(sec => {
      acc[asgn.className].push({ section: sec, subject: asgn.subject });
    });
    return acc;
  }, {} as Record<string, { section: string, subject: string }[]>);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [formData, setFormData] = useState({ 
    chapter: '', 
    topics: '', 
    homework: '' 
  });

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleGrade = (grade: string) => {
    const keys = groupedAssignments[grade].map(a => `${grade}-${a.section}-${a.subject}`);
    const allSelected = keys.every(k => selectedKeys.includes(k));
    if (allSelected) {
      setSelectedKeys(prev => prev.filter(k => !keys.includes(k)));
    } else {
      setSelectedKeys(prev => Array.from(new Set([...prev, ...keys])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeys.length === 0) return alert("Please select at least one class/section target.");

    setIsSubmitting(true);
    try {
      const plansToSubmit = selectedKeys.map(key => {
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

      // Sequential: Wait for Firestore, email is handled separately/background in API
      await APIService.submitMultiplePlans(plansToSubmit);
      
      // Success path
      setSubmittedThisWeek(true);
      setFormData({ chapter: '', topics: '', homework: '' });
      setSelectedKeys([]);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Database error: Could not save your plans. Please check your internet.");
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
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">Weekly Plan Logged</h2>
        <p className="text-slate-500 font-medium mb-10 max-w-xs mx-auto text-sm">Your lesson plans for {weekLabel} have been securely synchronized with the institutional cloud.</p>
        <button 
          onClick={() => setSubmittedThisWeek(false)} 
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
        >
          Submit Another Plan
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      {/* Form Side */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-left duration-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Weekly Submission</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">{weekLabel}</p>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-xl">
            <Layers className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Targets: Grouped by Grade</label>
            <div className="space-y-3">
              {Object.keys(groupedAssignments).sort().map(grade => (
                <div key={grade} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-indigo-600" /> Class {grade}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => toggleGrade(grade)} 
                      className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                    >
                      {groupedAssignments[grade].every(a => selectedKeys.includes(`${grade}-${a.section}-${a.subject}`)) ? 'Deselect Grade' : 'Select All Sections'}
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
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            active 
                              ? 'bg-white border-indigo-300 text-indigo-700 shadow-sm ring-1 ring-indigo-300' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {active ? <CheckSquare className="h-4 w-4 shrink-0 text-indigo-600" /> : <Square className="h-4 w-4 shrink-0" />}
                          <span className="text-[10px] font-bold uppercase truncate">{asgn.subject} ({asgn.section})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="relative">
              <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                required 
                placeholder="Chapter Name / Number" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all text-sm" 
                value={formData.chapter} 
                onChange={e => setFormData({ ...formData, chapter: e.target.value })} 
              />
            </div>
            
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Topics to be covered</label>
               <textarea 
                required 
                rows={3} 
                placeholder="Break down your teaching objectives..." 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 resize-none transition-all text-sm" 
                value={formData.topics} 
                onChange={e => setFormData({ ...formData, topics: e.target.value })} 
              />
            </div>

            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Homework Assignments</label>
               <textarea 
                required 
                rows={2} 
                placeholder="Exercises, tasks, or self-study..." 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 resize-none transition-all text-sm" 
                value={formData.homework} 
                onChange={e => setFormData({ ...formData, homework: e.target.value })} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Commit Submission</>}
          </button>
        </form>
      </div>

      {/* History Side */}
      <div className="space-y-8 animate-in slide-in-from-right duration-700">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tight">Recent Archives</h3>
            <ClipboardList className="h-5 w-5 text-slate-300" />
          </div>
          
          <div className="space-y-3">
            {planHistory.length > 0 ? planHistory.slice(0, 10).map(plan => (
              <div key={plan.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                   <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                   </div>
                   <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">Class {plan.className}-{plan.section}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{plan.weekLabel}</span>
                    </div>
                    <h4 className="text-[11px] font-black text-slate-900 italic tracking-tight">{plan.subject}: {plan.chapter}</h4>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">No archives found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
