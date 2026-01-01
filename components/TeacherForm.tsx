
import React, { useState, useEffect } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName } from '../types';
import { getUpcomingMonday, getNextSaturday, formatDate } from '../utils';
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
      teacherEmail: teacher.email,
      dateFrom: formatDate(upcomingMonday),
      dateTo: formatDate(nextSaturday),
      weekStarting: upcomingMonday.toISOString(),
      submittedAt: new Date().toISOString()
    }));
    onSubmit(submission);
  };

  const handleResubmitRequest = async (plan: LessonPlan) => {
    setIsRequesting(plan.id);
    await APIService.requestResubmission(plan, teacher.email);
    const updated = await APIService.fetchLessonPlans(teacher.id);
    setHistory(updated);
    setIsRequesting(null);
    alert("Resubmission request sent to admin.");
  };

  return (
    <div className="space-y-8">
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mx-auto">
        <button onClick={() => setActiveView('submit')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'submit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Weekly Submission</button>
        <button onClick={() => setActiveView('history')} className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Submission History</button>
      </div>

      {activeView === 'submit' ? (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* ... existing form header ... */}
          {groupKeys.map((key) => {
            const group = uniqueGroups[key];
            return (
              <div key={key} className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Class {group.className} - {group.subject}</h3>
                </div>
                <div className="p-6 space-y-6">
                  <input required className="w-full px-4 py-2 border rounded-lg" placeholder="Chapter Name" value={formData[key].chapter} onChange={e => setFormData({...formData, [key]: {...formData[key], chapter: e.target.value}})} />
                  <textarea required className="w-full px-4 py-2 border rounded-lg" placeholder="Topics" value={formData[key].topics} onChange={e => setFormData({...formData, [key]: {...formData[key], topics: e.target.value}})} />
                  <textarea required className="w-full px-4 py-2 border rounded-lg" placeholder="Homework" value={formData[key].homework} onChange={e => setFormData({...formData, [key]: {...formData[key], homework: e.target.value}})} />
                </div>
              </div>
            );
          })}
          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">Submit Lesson Plans</button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {history.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{plan.className} - {plan.subject}</p>
                <h4 className="text-lg font-bold text-slate-800">{plan.chapter}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Submitted: {new Date(plan.submittedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                {plan.resubmissionStatus === 'pending' ? (
                  <span className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase border border-amber-100 bg-amber-50 px-3 py-1 rounded-lg"><Clock className="h-3 w-3" /> Approval Pending</span>
                ) : plan.resubmissionStatus === 'declined' ? (
                  <span className="flex items-center gap-1.5 text-rose-500 font-black text-[10px] uppercase border border-rose-100 bg-rose-50 px-3 py-1 rounded-lg"><AlertCircle className="h-3 w-3" /> Request Declined</span>
                ) : (
                  <button 
                    disabled={isRequesting === plan.id}
                    onClick={() => handleResubmitRequest(plan)} 
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isRequesting === plan.id ? 'animate-spin' : ''}`} /> 
                    Request Resubmit
                  </button>
                )}
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-slate-400 font-bold py-20 uppercase tracking-widest text-xs">No submission history found.</p>}
        </div>
      )}
    </div>
  );
};

export default TeacherForm;
