
import React from 'react';
import { LessonPlan, Teacher, ClassName, SectionName } from '../types';

interface PrintableReportProps {
  className: ClassName;
  sectionName: SectionName;
  plans: LessonPlan[];
  teachers: Teacher[];
  weekStarting: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ className, sectionName, plans, teachers, weekStarting }) => {
  const startDate = new Date(weekStarting);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 5); // Monday to Saturday

  // Find class teacher for the section header
  const sectionTeacher = teachers.find(t => 
    t.isClassTeacher && 
    t.classTeacherOf?.className === className && 
    t.classTeacherOf?.section === sectionName
  );

  // Get all assignments for this specific Class and Section
  const targetAssignments: Array<{ teacher: Teacher, subject: string }> = [];
  teachers.forEach(t => {
    t.assignments.forEach(asgn => {
      if (asgn.className === className && asgn.sections.includes(sectionName)) {
        targetAssignments.push({ teacher: t, subject: asgn.subject });
      }
    });
  });

  // Sort by subject name
  targetAssignments.sort((a, b) => a.subject.localeCompare(b.subject));

  return (
    <div className="bg-white text-black p-0 w-full font-serif" style={{ minHeight: '180mm' }}>
      <div className="border-2 border-black p-6">
        {/* Screenshot Style Header */}
        <div className="flex justify-center items-center gap-6 mb-4">
           <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-20 h-20 object-contain" />
           <div className="text-center">
             <h1 className="text-2xl font-black uppercase">Sacred Heart School</h1>
             <p className="text-xs font-bold">(Affiliated to CBSE, New Delhi, upto +2 Level)</p>
             <h2 className="text-xl font-black uppercase mt-2 tracking-[0.2em] border-b-2 border-black inline-block px-8 pb-1">Weekly Syllabus</h2>
           </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 gap-1 mb-6 text-[13px] font-bold">
          <div className="flex"><span className="w-52">Date</span>: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div className="flex"><span className="w-52">Class & Sec</span>: {className} {sectionName}</div>
          <div className="flex"><span className="w-52">Name of Class Teacher</span>: {sectionTeacher?.name || '-----------------'}</div>
        </div>

        {/* The Exact Table from Screenshot */}
        <table className="w-full border-collapse border border-black text-[12px]">
          <thead>
            <tr>
              <th className="border border-black p-2 text-left w-32 bg-slate-50 font-black">Subject</th>
              <th className="border border-black p-2 text-left w-40 bg-slate-50 font-black">Subject Teacher</th>
              <th className="border border-black p-2 text-left w-44 bg-slate-50 font-black">Chapter Name</th>
              <th className="border border-black p-2 text-left bg-slate-50 font-black">Topics/Sub-Topics</th>
              <th className="border border-black p-2 text-left w-56 bg-slate-50 font-black">Home Assignments</th>
            </tr>
          </thead>
          <tbody>
            {targetAssignments.map((asgn, idx) => {
              const plan = plans.find(p => 
                p.teacherId === asgn.teacher.id && 
                p.className === className && 
                p.subject === asgn.subject &&
                p.weekStarting === weekStarting
              );

              return (
                <tr key={idx} className="align-top min-h-[80px]">
                  <td className="border border-black p-2 font-bold">{asgn.subject}</td>
                  <td className="border border-black p-2">{asgn.teacher.name}</td>
                  <td className={`border border-black p-2 font-black ${!plan ? 'text-red-600' : ''}`}>
                    {plan ? plan.chapter : 'LESSON PLAN PENDING'}
                  </td>
                  <td className={`border border-black p-2 whitespace-pre-wrap italic ${!plan ? 'text-red-500 font-bold' : ''}`}>
                    {plan ? plan.topics : 'Weekly topics not submitted by faculty.'}
                  </td>
                  <td className={`border border-black p-2 whitespace-pre-wrap ${!plan ? 'text-red-500 font-black' : ''}`}>
                    {plan ? plan.homework : 'NOT ASSIGNED'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signature Area */}
        <div className="mt-16 flex justify-between px-10 italic">
           <div className="text-center border-t border-black pt-1 w-40 font-bold text-[10px]">Class Teacher</div>
           <div className="text-center border-t border-black pt-1 w-40 font-bold text-[10px]">Principal</div>
        </div>
      </div>
      
      <div className="mt-4 text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest print:hidden">
        Institutional Record • Sacred Heart Cloud System
      </div>
    </div>
  );
};

export default PrintableReport;
