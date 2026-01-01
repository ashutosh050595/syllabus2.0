
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
      <div className="border-[3px] border-black p-8">
        {/* Institutional Header */}
        <div className="text-center mb-10 relative">
          <div className="absolute left-0 top-0 w-20 h-20">
             <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Sacred Heart School, Telaiya Dam</h1>
          <p className="text-xs font-bold">(Affiliated to CBSE, New Delhi | An ISO Certified Institution)</p>
          <div className="mt-6 border-b-4 border-black inline-block px-16 pb-2">
            <h2 className="text-2xl font-black uppercase tracking-[0.15em]">Weekly Syllabus Digest</h2>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-2 gap-y-3 mb-10 text-[12px] font-bold italic">
          <div className="flex border-b border-black/10 pb-2"><span className="w-52 font-black uppercase not-italic">From Date</span>: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (Monday)</div>
          <div className="flex border-b border-black/10 pb-2"><span className="w-52 font-black uppercase not-italic">To Date</span>: {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (Saturday)</div>
          <div className="flex border-b border-black/10 pb-2"><span className="w-52 font-black uppercase not-italic">Target Class</span>: {className} - {sectionName}</div>
          <div className="flex border-b border-black/10 pb-2"><span className="w-52 font-black uppercase not-italic">Class Teacher</span>: {sectionTeacher?.name || 'NOT ASSIGNED'}</div>
        </div>

        {/* Master Syllabus Table */}
        <table className="w-full border-collapse border-[2px] border-black text-[11px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-[2px] border-black p-3 text-left w-36 uppercase font-black">Subject</th>
              <th className="border-[2px] border-black p-3 text-left w-40 uppercase font-black">Faculty Member</th>
              <th className="border-[2px] border-black p-3 text-left w-44 uppercase font-black">Chapter</th>
              <th className="border-[2px] border-black p-3 text-left uppercase font-black">Topics & Objectives</th>
              <th className="border-[2px] border-black p-3 text-left w-56 uppercase font-black">Home Assignments</th>
            </tr>
          </thead>
          <tbody>
            {targetAssignments.length > 0 ? targetAssignments.map((asgn, idx) => {
              // Find submission for this subject/class/section for the current week
              const plan = plans.find(p => 
                p.teacherId === asgn.teacher.id && 
                p.className === className && 
                p.subject === asgn.subject &&
                p.weekStarting === weekStarting
              );

              return (
                <tr key={idx} className="align-top">
                  <td className="border-[2px] border-black p-3 font-black bg-slate-50/40 uppercase">{asgn.subject}</td>
                  <td className="border-[2px] border-black p-3 font-bold uppercase">{asgn.teacher.name}</td>
                  <td className={`border-[2px] border-black p-3 uppercase font-black ${!plan ? 'text-red-600' : ''}`}>
                    {plan ? plan.chapter : 'LESSON PLAN PENDING'}
                  </td>
                  <td className={`border-[2px] border-black p-3 whitespace-pre-wrap leading-tight font-semibold ${!plan ? 'text-red-600 italic' : ''}`}>
                    {plan ? plan.topics : 'Data not available for the upcoming reporting period.'}
                  </td>
                  <td className={`border-[2px] border-black p-3 whitespace-pre-wrap leading-tight font-medium ${!plan ? 'text-red-600 font-black' : ''}`}>
                    {plan ? plan.homework : 'PENDING'}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="border-2 border-black p-20 text-center text-slate-400 font-black uppercase italic tracking-widest">
                  Academic mapping required for Class {className}-{sectionName}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Institutional Signature Block */}
        <div className="mt-20 flex justify-between items-end px-10">
           <div className="text-center border-t-2 border-black pt-2 w-48 font-black text-[10px] uppercase tracking-tighter">Authorized Class Teacher</div>
           <div className="text-center border-t-2 border-black pt-2 w-48 font-black text-[10px] uppercase tracking-tighter">Academic Coordinator</div>
           <div className="text-center border-t-2 border-black pt-2 w-48 font-black text-[10px] uppercase tracking-tighter">Principal / H.M Seal</div>
        </div>
      </div>
      
      <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase text-center tracking-[0.5em] print:hidden">
        Institutional Record • Sacred Heart Cloud Hub • Digitally Validated
      </div>
    </div>
  );
};

export default PrintableReport;
