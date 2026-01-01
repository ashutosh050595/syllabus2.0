
import React, { useState, useEffect } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName } from '../types';
import { getUpcomingMonday, getNextSaturday, formatDate, getWeekLabel } from '../utils';
import { Send, History, RefreshCcw, Loader2 } from 'lucide-react';
import { APIService } from '../services/api';

interface TeacherFormProps {
  teacher: Teacher;
  onSubmit: (data: any) => Promise<void>;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSubmit }) => {
  const [activeView, setActiveView] = useState<'submit' | 'history'>('submit');
  const [history, setHistory] = useState<LessonPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);

  const upcomingMonday = getUpcomingMonday();
  const nextSaturday = getNextSaturday(upcomingMonday);
  const currentWeekLabel = getWeekLabel(upcomingMonday);

  useEffect(() => {
    if (activeView === 'history') {
      APIService.fetchLessonPlans(teacher.id).then(setHistory);
    }
  }, [activeView, teacher.id]);

  // Group assignments by Class-Subject to show one card for multiple sections
  const uniqueGroups = teacher.assignments.reduce((acc, curr) => {
    const key = `${curr.className}-${curr.subject}`;
    if (!acc[key]) acc[key] = { className: curr.className, subject: curr.subject, sections: [] };
    acc[key].sections.push(...curr.sections);
    return acc;
  }, {} as Record<string, { className: ClassName, subject: string, sections: SectionName[] }>);

  const groupKeys = Object.keys(uniqueGroups);
  const [formData, setFormData] = useState<Record<string, any>>(
    groupKeys.reduce((acc, key) => ({ ...acc, [key]: { chapter: '', topics: '', homework: '' } }), {})
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissions = groupKeys.map(key => ({
        ...uniqueGroups[key],
        ...formData[key],
        teacherId: teacher.id,
        teacherName: teacher.name,
        id: `${teacher.id}-${key}-${Date.now()}`,
        dateFrom: formatDate(upcomingMonday),
        dateTo: formatDate(nextSaturday),
        weekStarting: upcomingMonday.toISOString(),
        submittedAt: new Date().toISOString(),
        weekLabel: currentWeekLabel
      }));
      await onSubmit(submissions);
      alert("Weekly Syllabus Dispatch Successful!");
      setFormData(groupKeys.reduce((acc, key) => ({ ...acc, [key]: { chapter: '', topics: '', homework: '' } }), {}));
    } catch (error) {
      alert("Submission error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
        <button onClick={() => setActiveView('submit')} className={`px-8 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${activeView === 'submit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>New Dispatch</button>
        <button onClick={() => setActiveView('history')} className={`px-8 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>My Records</button>
      </div>

      {activeView === 'submit' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl text-center">
            <h2 className="text-indigo-900 font-black text-sm uppercase italic">Syllabus Coverage Plan</h2>
            <p className="text-indigo-600 font-bold text-[10px] mt-1 tracking-widest uppercase">{currentWeekLabel}</p>
          </div>

          {groupKeys.map((key) => {
            const group = uniqueGroups[key];
            return (
              <div key={key} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-700 italic">Class {group.className} • {group.subject}</h3>
                  <div className="flex gap-1">
                    {group.sections.map(s => <span key={s} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[8px] font-black">{s}</span>)}
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Chapter / Unit Title</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-indigo-500 outline-none" placeholder="Enter Chapter Name..." value={formData[key].chapter} onChange={e => setFormData({...formData, [key]: {...formData[key], chapter: e.target.value}})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Topics to Cover</label>
                      <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-indigo-500 outline-none resize-none" placeholder="List specific topics..." value={formData[key].topics} onChange={e => setFormData({...formData, [key]: {...formData[key], topics: e.target.value}})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Home Assignment</label>
                      <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-indigo-500 outline-none resize-none" placeholder="Homework for students..." value={formData[key].homework} onChange={e => setFormData({...formData, [key]: {...formData[key], homework: e.target.value}})} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? 'Dispatching...' : 'Dispatch Weekly Plans'}
          </button>
        </form>
      ) : (
        <div className="space-y-3 animate-in fade-in">
          {history.length > 0 ? history.map(plan => (
            <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{plan.className} • {plan.subject}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{plan.weekLabel}</span>
                </div>
                <h4 className="text-sm font-black text-slate-800 italic">{plan.chapter}</h4>
              </div>
              <button 
                disabled={isRequesting === plan.id}
                onClick={async () => {
                   setIsRequesting(plan.id);
                   await APIService.requestResubmission(plan, teacher.email);
                   alert("Resubmit request sent to Admin.");
                   setIsRequesting(null);
                }} 
                className="text-[9px] font-black uppercase text-indigo-600 border border-indigo-100 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                {isRequesting === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                Request Edit
              </button>
            </div>
          )) : (
            <div className="bg-white p-20 rounded-[2rem] border border-dashed border-slate-200 text-center">
               <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No records found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherForm;
