
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

  // Group assignments by Grade/Class for the UI logic
  const groupedAssignments = teacher.assignments.reduce((acc, asgn) => {
    // Map Roman to numeric if preferred for display
    const gradeNum = asgn.className;
    if (!acc[gradeNum]) acc[gradeNum] = [];
    asgn.sections.forEach(sec => {
      acc[gradeNum].push({ section: sec, subject: asgn.subject });
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
    const allSelectedInGrade = keys.every(k => selectedKeys.includes(k));
    if (allSelectedInGrade) {
      setSelectedKeys(prev => prev.filter(k => !keys.includes(k)));
    } else {
      setSelectedKeys(prev => Array.from(new Set([...prev, ...keys])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeys.length === 0) return alert("Select at least one class.");

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
      
      // Success triggers immediate UI change
      setSubmittedThisWeek(true);
      setFormData({ chapter: '', topics: '', homework: '' });
      setSelectedKeys([]);
    } catch (err) {
      alert("Submission failed. Your changes were not saved.");
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
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Submission Successful</h2>
        <p className="text-slate-500 text-sm mb-10">Your weekly plans have been logged and sent to the administrator.</p>
        <button 
          onClick={() => setSubmittedThisWeek(false)} 
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
        >
          Submit Another Plan
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-left duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Weekly Lesson Plan</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">{weekLabel}</p>
          </div>
          <Layers className="h-6 w-6 text-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block">Target Classes (By Grade)</label>
            <div className="space-y-3">
              {Object.keys(groupedAssignments).sort().map(grade => (
                <div key={grade} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-900">Grade {grade}</span>
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
                            active ? 'bg-white border-indigo-300 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {active ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
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
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm transition-all" 
                value={formData.chapter} 
                onChange={e => setFormData({ ...formData, chapter: e.target.value })} 
              />
            </div>
            
            <textarea 
              required 
              rows={3} 
              placeholder="Topics to be covered..." 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none transition-all" 
              value={formData.topics} 
              onChange={e => setFormData({ ...formData, topics: e.target.value })} 
            />

            <textarea 
              required 
              rows={2} 
              placeholder="Homework Assignments..." 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 text-sm resize-none transition-all" 
              value={formData.homework} 
              onChange={e => setFormData({ ...formData, homework: e.target.value })} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Submit To Registry</>}
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-right duration-500">
        <h3 className="text-xl font-black uppercase italic tracking-tight mb-8">Recent Submissions</h3>
        <div className="space-y-3">
          {planHistory.length > 0 ? planHistory.slice(0, 10).map(plan => (
            <div key={plan.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">{plan.className}-{plan.section}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{plan.weekLabel}</span>
                </div>
                <h4 className="text-[11px] font-black text-slate-900 italic">{plan.subject}: {plan.chapter}</h4>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-3xl">
              <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Archive Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
