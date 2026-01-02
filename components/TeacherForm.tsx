
import React, { useState } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Teacher, LessonPlan } from '../types';
import { APIService } from '../services/api';

interface TeacherFormProps {
  teacher: Teacher;
  history: LessonPlan[];
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, history: planHistory }) => {
  // Define state for tracking which plan is currently requesting an edit
  const [isRequesting, setIsRequesting] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black uppercase italic tracking-tight mb-6">Submission History</h3>
        
        <div className="space-y-3 animate-in fade-in">
          {planHistory.length > 0 ? planHistory.map(plan => (
            <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{plan.className} • {plan.subject}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{plan.weekLabel}</span>
                  {plan.resubmissionStatus === 'pending' && (
                    <span className="text-[7px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded uppercase animate-pulse">Pending Admin Approval</span>
                  )}
                  {plan.resubmissionStatus === 'declined' && (
                    <span className="text-[7px] font-black bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded uppercase">Request Declined</span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-800 italic">{plan.chapter}</h4>
              </div>
              
              {(!plan.resubmissionStatus || plan.resubmissionStatus === 'none' || plan.resubmissionStatus === 'declined') ? (
                <button 
                  disabled={isRequesting === plan.id} 
                  onClick={async () => { 
                    if(!confirm("Request Admin to unlock this record for editing?")) return;
                    setIsRequesting(plan.id); 
                    await APIService.requestResubmission(plan, teacher.email); 
                    alert("Request sent to Admin."); 
                    setIsRequesting(null); 
                  }} 
                  className="text-[9px] font-black uppercase text-indigo-600 border border-indigo-100 bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-indigo-600 hover:text-white"
                >
                  {isRequesting === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />} 
                  {plan.resubmissionStatus === 'declined' ? 'Retry Request' : 'Request Edit'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 italic px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Loader2 className="h-3 w-3 animate-spin" /> Waiting for Response
                </div>
              )}
            </div>
          )) : (
            <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No submission history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
