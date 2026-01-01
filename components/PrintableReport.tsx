
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
  endDate.setDate(startDate.getDate() + 5); // Monday to Saturday (5 days after Monday)

  // 1. Identify all required rows for this specific Class AND Section
  const targetAssignments: Array<{ teacher: Teacher, subject: string }> = [];
  
  teachers.forEach(t => {
    t.assignments.forEach(asgn => {
      if (asgn.className === className && asgn.sections.includes(sectionName)) {
        targetAssignments.push({
          teacher: t,
          subject: asgn.subject
        });
      }
    });
  });

  // Sort assignments by subject for a clean report layout
  targetAssignments.sort((a, b) => a.subject.localeCompare(b.subject));

  // Find class teacher for the section header
  const sectionTeacher = teachers.find(t => 
    t.isClassTeacher && 
    t.classTeacherOf?.className === className && 
    t.classTeacherOf?.section === sectionName
  );

  return (
    <div className="bg-white text-black p-0 w-full" style={{ minHeight: '180mm' }}>
      <div className="border-[3px] border-black p-6">
        {/* Institutional Header */}
        <div className="text-center mb-6 relative">
          <div className="absolute left-0 top-0 w-16 h-16">
             <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Sacred Heart School, Telaiya Dam</h1>
          <p className="text-[10px] font-bold">(Affiliated to CBSE, New Delhi | An ISO Certified Institution)</p>
          <div className="mt-4 border-b-4 border-black inline-block px-12 pb-1">
            <h2 className="text-xl font-black uppercase tracking-[0.1em]">Weekly Academic Syllabus Digest</h2>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-2 gap-y-2 mb-6 text-[11px] font-bold italic">
          <div className="flex border-b border-black/10 pb-1"><span className="w-48 font-black uppercase not-italic">Week Starting</span>: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (Monday)</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-48 font-black uppercase not-italic">Week Ending</span>: {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (Saturday)</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-48 font-black uppercase not-italic">Target Class</span>: {className} - {sectionName}</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-48 font-black uppercase not-italic">Class Teacher</span>: {sectionTeacher?.name || 'N/A'}</div>
        </div>

        {/* Master Syllabus Table */}
        <table className="w-full border-collapse border-[2px] border-black text-[10px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-[2px] border-black p-2.5 text-left w-32 uppercase font-black">Subject</th>
              <th className="border-[2px] border-black p-2.5 text-left w-36 uppercase font-black">Faculty</th>
              <th className="border-[2px] border-black p-2.5 text-left w-40 uppercase font-black">Chapter</th>
              <th className="border-[2px] border-black p-2.5 text-left uppercase font-black">Topics to be Taught</th>
              <th className="border-[2px] border-black p-2.5 text-left w-48 uppercase font-black">Homework / Assignment</th>
            </tr>
          </thead>
          <tbody>
            {targetAssignments.length > 0 ? targetAssignments.map((asgn, idx) => {
              // Find submission for this subject/class/section for the current week
              const plan = plans.find(p => 
                p.teacherId === asgn.teacher.id && 
                p.className === className && 
                // Note: TeacherForm might submit to 'sections' array, but for report we check if this section is included
                p.subject === asgn.subject &&
                p.weekStarting === weekStarting
              );

              return (
                <tr key={idx} className="align-top">
                  <td className="border-[2px] border-black p-2.5 font-black bg-slate-50/30">{asgn.subject}</td>
                  <td className="border-[2px] border-black p-2.5 font-bold uppercase">{asgn.teacher.name}</td>
                  <td className={`border-[2px] border-black p-2.5 uppercase font-black ${!plan ? 'text-red-600' : ''}`}>
                    {plan ? plan.chapter : 'LESSON PLAN PENDING'}
                  </td>
                  <td className={`border-[2px] border-black p-2.5 whitespace-pre-wrap leading-tight font-semibold ${!plan ? 'text-red-600 italic' : ''}`}>
                    {plan ? plan.topics : 'No data submitted for this section for the upcoming week.'}
                  </td>
                  <td className={`border-[2px] border-black p-2.5 whitespace-pre-wrap leading-tight font-medium ${!plan ? 'text-red-600 font-black' : ''}`}>
                    {plan ? plan.homework : 'PENDING'}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="border-2 border-black p-12 text-center text-slate-400 font-black uppercase italic">
                  No subject specialist assigned for {className}-{sectionName}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer Auth */}
        <div className="mt-12 flex justify-between items-end px-4">
           <div className="text-center border-t border-black pt-1 w-32 font-black text-[8px] uppercase">Class Teacher</div>
           <div className="text-center border-t border-black pt-1 w-32 font-black text-[8px] uppercase">Coordinator</div>
           <div className="text-center border-t border-black pt-1 w-32 font-black text-[8px] uppercase">Principal</div>
        </div>
      </div>
      
      <div className="mt-2 text-[8px] text-slate-400 font-bold uppercase text-center tracking-[0.3em] print:hidden">
        Digital Academic Record • Sacred Heart Cloud
      </div>
    </div>
  );
};

export default PrintableReport;
