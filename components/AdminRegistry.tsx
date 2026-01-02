
import React, { useState } from 'react';
import { Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, Mail } from 'lucide-react';
import { Teacher, LessonPlan } from '../types';
import { APIService } from '../services/api';
import { INITIAL_TEACHERS } from '../constants';

interface AdminRegistryProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  onAddTeacher: (teacher: Teacher) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  onRemoveTeacher: (id: string) => Promise<void>;
}

const AdminRegistry: React.FC<AdminRegistryProps> = ({ 
  teachers, 
  lessonPlans, 
  onAddTeacher, 
  onUpdateTeacher, 
  onRemoveTeacher 
}) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);

  const handleSeed = async () => {
    if (!confirm(`Seed cloud faculty registry with ${INITIAL_TEACHERS.length} local records?`)) return;
    setIsSeeding(true);
    try {
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      alert(`Success: ${INITIAL_TEACHERS.length} faculty members synchronized to cloud.`);
      window.location.reload(); 
    } catch (e) {
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSendWarnings = async () => {
    if (!confirm("Send automated email reminders to all teachers who haven't submitted plans for next week?")) return;
    setIsSendingAlerts(true);
    try {
      await APIService.triggerDefaulterReminders();
      alert("Warning protocol initiated via Google Apps Script.");
    } catch (e) {
      alert("Failed to trigger warnings.");
    } finally {
      setIsSendingAlerts(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Faculty Registry</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">Institutional Database</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSendWarnings}
            disabled={isSendingAlerts}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isSendingAlerts ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            Send Warnings
          </button>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isSeeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
            Seed Cloud
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Faculty Member</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Assignments</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {teachers.map(teacher => (
              <tr key={teacher.id} className="group hover:bg-slate-50 transition-colors">
                <td className="py-5 px-4">
                  <div className="font-black text-slate-900 italic">{teacher.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{teacher.email}</div>
                </td>
                <td className="py-5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {teacher.assignments.map((asgn, idx) => (
                      <span key={idx} className="text-[8px] font-black bg-white border border-slate-200 text-indigo-600 px-2 py-0.5 rounded uppercase">
                        {asgn.subject} ({asgn.className})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-5 px-4">
                  {teacher.isClassTeacher ? (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase">
                      CT {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}
                    </span>
                  ) : (
                    <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase">Faculty</span>
                  )}
                </td>
                <td className="py-5 px-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onUpdateTeacher(teacher.id, {})} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => onRemoveTeacher(teacher.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRegistry;
