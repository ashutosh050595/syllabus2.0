import React, { useState, useEffect } from 'react';
import { AlertTriangle, Mail, Clock, Users, Calendar, Send } from 'lucide-react';
import { Teacher, LessonPlan } from '../types';
import { APIService } from '../services/api';
import { getUpcomingMonday, formatDate } from '../utils';

interface DefaultersListProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
}

const DefaultersList: React.FC<DefaultersListProps> = ({ teachers, lessonPlans }) => {
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const upcomingMonday = getUpcomingMonday();
    return upcomingMonday.toISOString();
  });

  // Get defaulters for selected week
  const getDefaulters = () => {
    const submittedTeachers = new Set(
      lessonPlans
        .filter(plan => plan.weekStarting === selectedWeek && plan.resubmissionStatus !== 'pending')
        .map(plan => plan.teacherId)
    );
    
    return teachers.filter(teacher => !submittedTeachers.has(teacher.email));
  };

  const defaulters = getDefaulters();
  const upcomingMonday = new Date(selectedWeek);
  const weekLabel = `${formatDate(upcomingMonday)} - ${formatDate(new Date(upcomingMonday.getTime() + 6 * 24 * 60 * 60 * 1000))}`;

  const handleSendReminders = async () => {
    if (defaulters.length === 0) {
      alert("No defaulters to send reminders to.");
      return;
    }

    if (!confirm(`Send email reminders to ${defaulters.length} teacher(s) who haven't submitted lesson plans for the upcoming week?`)) return;
    
    setIsSendingReminders(true);
    try {
      await APIService.sendDefaulterReminders(defaulters, weekLabel);
      alert(`Reminders sent to ${defaulters.length} teacher(s).`);
    } catch (error) {
      console.error("Error sending reminders:", error);
      alert("Failed to send reminders. Please try again.");
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Generate weeks for selection (last 4 and next 2)
  const getWeekOptions = () => {
    const options = [];
    const today = new Date();
    
    // Add past 4 weeks
    for (let i = 4; i > 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      const monday = new Date(date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      options.push({
        value: monday.toISOString(),
        label: `${formatDate(monday)} - ${formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))}`
      });
    }
    
    // Add current and next 2 weeks
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + (i * 7));
      const monday = new Date(date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      options.push({
        value: monday.toISOString(),
        label: `${formatDate(monday)} - ${formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))}${i === 0 ? ' (Current)' : ''}`
      });
    }
    
    return options;
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Defaulters List</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Teachers who haven't submitted lesson plans
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {getWeekOptions().map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button 
            onClick={handleSendReminders}
            disabled={isSendingReminders || defaulters.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all disabled:opacity-50"
          >
            {isSendingReminders ? (
              <Clock className="h-3 w-3 animate-pulse" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Send Reminders ({defaulters.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Total Teachers</div>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-900">{teachers.length}</div>
        </div>
        
        <div className="bg-emerald-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Submitted This Week</div>
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900">{teachers.length - defaulters.length}</div>
        </div>
        
        <div className="bg-rose-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Pending Submissions</div>
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900">{defaulters.length}</div>
        </div>
      </div>

      {defaulters.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
          <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
          <p className="text-emerald-600 font-bold mb-2">All teachers have submitted!</p>
          <p className="text-[10px] text-slate-400">No defaulters for the selected week.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Teacher</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Email</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Assignments</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Last Submission</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {defaulters.map(teacher => {
                const lastSubmission = lessonPlans
                  .filter(plan => plan.teacherId === teacher.email)
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
                
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-4">
                      <div className="font-black text-slate-900 italic">{teacher.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{teacher.phone}</div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="text-[10px] font-bold text-slate-700">{teacher.email}</div>
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
                      {lastSubmission ? (
                        <div>
                          <div className="text-[10px] font-bold text-slate-900">
                            {new Date(lastSubmission.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-[8px] text-slate-400">
                            {lastSubmission.weekLabel}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded uppercase">
                          No submissions
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-4">
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent(`Reminder: Lesson Plan Submission - ${weekLabel}`);
                          const body = encodeURIComponent(`Dear ${teacher.name},\n\nThis is a reminder that your lesson plan submission for ${weekLabel} is pending. Please submit it at your earliest convenience.\n\nRegards,\nAdministration`);
                          window.open(`mailto:${teacher.email}?subject=${subject}&body=${body}`, '_blank');
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-100">
        Showing {defaulters.length} teacher(s) who haven't submitted lesson plans for week starting {formatDate(new Date(selectedWeek))}
      </div>
    </div>
  );
};

export default DefaultersList;
