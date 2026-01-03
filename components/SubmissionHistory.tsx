import React, { useState } from 'react';
import { Calendar, Filter, Search, Download, Mail } from 'lucide-react';
import { LessonPlan, Teacher } from '../types';

interface SubmissionHistoryProps {
  lessonPlans: LessonPlan[];
  teachers: Teacher[];
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ lessonPlans, teachers }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = lessonPlans.filter(plan => {
    if (selectedTeacher !== 'all' && plan.teacherId !== selectedTeacher) return false;
    if (searchTerm && !plan.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !plan.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (dateRange.from && dateRange.to) {
      const planDate = new Date(plan.submittedAt);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      if (planDate < fromDate || planDate > toDate) return false;
    }
    
    return true;
  });

  const getTeacherName = (email: string) => {
    const teacher = teachers.find(t => t.email === email);
    return teacher?.name || email;
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Submission History</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Track all lesson plan submissions
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by teacher or subject..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="all">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.email} value={teacher.email}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
        </div>
        
        <div>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Date</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Teacher</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Class-Section</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Subject</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Chapter</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Week</th>
              <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredPlans.map(plan => (
              <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-5 px-4">
                  <div className="text-[10px] font-bold text-slate-900">
                    {new Date(plan.submittedAt).toLocaleDateString()}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    {new Date(plan.submittedAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="py-5 px-4">
                  <div className="font-black text-slate-900">{getTeacherName(plan.teacherId)}</div>
                  <div className="text-[10px] text-slate-400">{plan.teacherId}</div>
                </td>
                <td className="py-5 px-4">
                  <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded">
                    {plan.className}-{plan.section}
                  </span>
                </td>
                <td className="py-5 px-4 font-bold">{plan.subject}</td>
                <td className="py-5 px-4">{plan.chapter}</td>
                <td className="py-5 px-4">
                  <div className="text-[10px] font-bold text-slate-900">{plan.weekLabel}</div>
                </td>
                <td className="py-5 px-4">
                  {plan.resubmissionStatus === 'pending' ? (
                    <span className="text-[8px] font-black bg-yellow-50 text-yellow-600 px-2 py-1 rounded">
                      Resubmission Pending
                    </span>
                  ) : plan.resubmissionStatus === 'approved' ? (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                      Resubmission Approved
                    </span>
                  ) : (
                    <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      Submitted
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPlans.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold">No submissions found</p>
          </div>
        )}
      </div>
      
      <div className="text-[10px] text-slate-400 font-bold">
        Showing {filteredPlans.length} of {lessonPlans.length} total submissions
      </div>
    </div>
  );
};

export default SubmissionHistory;
