
import React, { useState, useEffect } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName } from '../types';
import { getUpcomingMonday, getNextSaturday, formatDate, getWeekLabel } from '../utils';
import { Send, History, RefreshCcw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { APIService } from '../services/api';

interface TeacherFormProps {
  teacher: Teacher;
  onSubmit: (data: any) => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSubmit }) => {
  const [activeView, setActiveView] = useState<'submit' | 'history'>('submit');
  const [history, setHistory] = useState<LessonPlan[]>([]);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);

  const upcomingMonday = getUpcomingMonday();
  const nextSaturday = getNextSaturday(upcomingMonday);
  const currentWeekLabel = getWeekLabel(upcomingMonday);

  useEffect(() => {
    if (activeView === 'history') {
      APIService.fetchLessonPlans(teacher.id).then(setHistory);
    }
  }, [activeView, teacher.id]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = groupKeys.map(key => ({
      ...uniqueGroups[key],
      ...formData[key],
      teacherId: teacher.email, // using email as ID for easier cross-ref
      teacherName: teacher.name,
      id: `${teacher.id}-${key}-${Date.now()}`,
      dateFrom: formatDate(upcomingMonday),
      dateTo: formatDate(nextSaturday),
      weekStarting: upcomingMonday.toISOString(),
      submittedAt: new Date().toISOString(),
      weekLabel: currentWeekLabel
    }));
    onSubmit(submission);
  };

  const handleResubmitRequest = async (plan: LessonPlan) => {
    setIsRequesting(plan.id);
    await APIService.requestResubmission(plan, teacher.email);
    const updated = await APIService.fetchLessonPlans(teacher.id);
    setHistory(updated);
    setIsRequesting(null);
    alert("Resubmission request sent to admin. You will be notified via email upon approval.");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mx-auto">
        <button onClick={() => setActiveView('submit')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'submit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Weekly Submission</button>
        <button onClick={() => setActiveView('history')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Submission History</button>
      </div>

      {activeView === 'submit' ? (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl text-center">
            <h2 className="text-indigo-900 font-black text-lg uppercase italic">Syllabus for Upcoming Week</h2>
            <p className="text-indigo-600 font-bold text-xs mt-1">{currentWeekLabel}</p>
          </div>

          {groupKeys.map((key) => {
            const group = uniqueGroups[key];
            return (
              <div key={key} className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white hover:border-indigo-200 transition-colors">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-slate-700">Class {group.className} • {group.subject}</h3>
                  <div className="flex gap-1">
                    {group.sections.map(s => <span key={s} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-black">{s}</span>)}
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Unit / Chapter Name</label>
                    <input required className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" placeholder="Enter chapter title..." value={formData[key].chapter} onChange={e => setFormData({...formData, [key]: {...formData[key], chapter: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Topics & Objectives</label>
                    <textarea required rows={3} className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" placeholder="Detailed topics to be covered..." value={formData[key].topics} onChange={e => setFormData({...formData, [key]: {...formData[key], topics: e.target.value}})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Weekly Home Assignment</label>
                    <textarea required rows={2} className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" placeholder="Rigorous tasks for students..." value={formData[key].homework} onChange={e => setFormData({...formData, [key]: {...formData[key], homework: e.target.value}})} />
                  </div>
                </div>
              </div>
            );
          })}
          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <Send className="h-4 w-4" /> Finalize & Dispatch Plans
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {history.length > 0 ? history.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-indigo-100 transition-all">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{plan.className} • {plan.subject}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{plan.weekLabel}</span>
                </div>
                <h4 className="text-lg font-black text-slate-800 leading-tight italic">{plan.chapter}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">LOGGED: {new Date(plan.submittedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                {plan.resubmissionStatus === 'pending' ? (
                  <span className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase border-2 border-amber-100 bg-amber-50 px-4 py-2 rounded-xl"><Clock className="h-3.5 w-3.5" /> Approval Awaited</span>
                ) : plan.resubmissionStatus === 'declined' ? (
                  <span className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase border-2 border-rose-100 bg-rose-50 px-4 py-2 rounded-xl"><AlertCircle className="h-3.5 w-3.5" /> Request Rejected</span>
                ) : (
                  <button 
                    disabled={isRequesting === plan.id}
                    onClick={() => handleResubmitRequest(plan)} 
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50 px-6 py-2.5 rounded-2xl transition-all active:scale-95"
                  >
                    <RefreshCcw className={`h-4 w-4 ${isRequesting === plan.id ? 'animate-spin' : ''}`} /> 
                    Resubmit Request
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
               <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No submission logs recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherForm;
