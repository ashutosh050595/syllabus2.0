
import React from 'react';
import { LessonPlan, Teacher, ClassName } from '../types';

interface PrintableReportProps {
  className: ClassName;
  plans: LessonPlan[];
  teachers: Teacher[];
  weekStarting: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ className, plans, teachers, weekStarting }) => {
  const startDate = new Date(weekStarting);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 12); // Matches "29-Dec to 10-Jan" style (approx 2 weeks)

  const classPlans = plans.filter(p => p.className === className && p.weekStarting === weekStarting);
  
  // Find class teacher
  const classTeacherProfile = teachers.find(t => t.isClassTeacher && t.classTeacherOf?.className === className);

  return (
    <div className="bg-white text-black p-0 w-full" style={{ minHeight: '210mm' }}>
      <div className="border-2 border-black p-4">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="absolute left-0 top-0 w-16 h-16">
             <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold uppercase">Sacred Heart School</h1>
          <p className="text-sm">(Affiliated to CBSE, New Delhi, upto +2 Level)</p>
          <div className="mt-4 border-b-2 border-black inline-block px-12 pb-1">
            <h2 className="text-xl font-bold uppercase tracking-widest">Weekly Syllabus</h2>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-y-1 mb-6 text-sm">
          <div className="flex"><span className="w-48 font-bold">Date</span>: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div className="flex"><span className="w-48 font-bold">Class & Sec</span>: {className} {classTeacherProfile?.classTeacherOf?.section || 'D'}</div>
          <div className="flex"><span className="w-48 font-bold">Name of Class Teacher</span>: {classTeacherProfile?.name || '---'}</div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border-2 border-black text-[11px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-2 border-black p-2 text-left w-24">Subject</th>
              <th className="border-2 border-black p-2 text-left w-32">Subject Teacher</th>
              <th className="border-2 border-black p-2 text-left w-32">Chapter Name</th>
              <th className="border-2 border-black p-2 text-left">Topics/Sub-Topics</th>
              <th className="border-2 border-black p-2 text-left w-48">Home Assignments</th>
            </tr>
          </thead>
          <tbody>
            {classPlans.length > 0 ? classPlans.map((plan, idx) => (
              <tr key={idx} className="align-top">
                <td className="border-2 border-black p-2 font-bold">{plan.subject}</td>
                <td className="border-2 border-black p-2">{plan.teacherName}</td>
                <td className="border-2 border-black p-2 uppercase font-semibold">{plan.chapter}</td>
                <td className="border-2 border-black p-2 whitespace-pre-wrap leading-tight">{plan.topics}</td>
                <td className="border-2 border-black p-2 whitespace-pre-wrap leading-tight">{plan.homework}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="border-2 border-black p-12 text-center text-slate-400 italic">No syllabus submissions found for this class and date range.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer Area */}
        <div className="mt-12 flex justify-between items-end px-4">
           <div className="text-center border-t border-black pt-1 w-32 font-bold text-[10px]">Class Teacher</div>
           <div className="text-center border-t border-black pt-1 w-32 font-bold text-[10px]">Academic In-charge</div>
           <div className="text-center border-t border-black pt-1 w-32 font-bold text-[10px]">Principal</div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReport;
