
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
  endDate.setDate(startDate.getDate() + 5); // Monday to Saturday (5 days after Monday)

  // 1. Identify all required rows by mapping teacher assignments to this class
  const classAssignments: Array<{ teacher: Teacher, subject: string, sections: string }> = [];
  
  teachers.forEach(t => {
    t.assignments.forEach(asgn => {
      if (asgn.className === className) {
        classAssignments.push({
          teacher: t,
          subject: asgn.subject,
          sections: asgn.sections.join(', ')
        });
      }
    });
  });

  // Sort assignments by subject for consistent report layout
  classAssignments.sort((a, b) => a.subject.localeCompare(b.subject));

  // Find class teacher for the header
  const classTeacherProfile = teachers.find(t => t.isClassTeacher && t.classTeacherOf?.className === className);

  return (
    <div className="bg-white text-black p-0 w-full" style={{ minHeight: '210mm' }}>
      <div className="border-[3px] border-black p-6">
        {/* Institutional Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute left-0 top-0 w-20 h-20">
             <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Sacred Heart School, Telaiya Dam</h1>
          <p className="text-sm font-bold">(Affiliated to CBSE, New Delhi)</p>
          <div className="mt-6 border-b-4 border-black inline-block px-16 pb-2">
            <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Weekly Syllabus Breakdown</h2>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-2 gap-y-2 mb-8 text-sm font-bold italic">
          <div className="flex border-b border-black/10 pb-1"><span className="w-56 font-black uppercase not-italic">Reporting Period</span>: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-56 font-black uppercase not-italic">Target Cohort</span>: Class {className} (All Sections)</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-56 font-black uppercase not-italic">Class Teacher</span>: {classTeacherProfile?.name || 'NOT ASSIGNED'}</div>
          <div className="flex border-b border-black/10 pb-1"><span className="w-56 font-black uppercase not-italic">Compilation Date</span>: {new Date().toLocaleDateString('en-GB')}</div>
        </div>

        {/* Master Syllabus Table */}
        <table className="w-full border-collapse border-[2px] border-black text-[11px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="border-[2px] border-black p-3 text-left w-28 uppercase font-black">Subject</th>
              <th className="border-[2px] border-black p-3 text-left w-36 uppercase font-black">Subject Expert</th>
              <th className="border-[2px] border-black p-3 text-left w-36 uppercase font-black">Chapter</th>
              <th className="border-[2px] border-black p-3 text-left uppercase font-black">Topics & Objectives</th>
              <th className="border-[2px] border-black p-3 text-left w-52 uppercase font-black">Home Assignments</th>
            </tr>
          </thead>
          <tbody>
            {classAssignments.length > 0 ? classAssignments.map((asgn, idx) => {
              // Find if this teacher submitted a plan for this subject/class for the current week
              const plan = plans.find(p => 
                p.teacherId === asgn.teacher.id && 
                p.className === className && 
                p.subject === asgn.subject &&
                p.weekStarting === weekStarting
              );

              return (
                <tr key={idx} className="align-top">
                  <td className="border-[2px] border-black p-3 font-black bg-slate-50/50">
                    {asgn.subject}
                    <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Sections: {asgn.sections}</div>
                  </td>
                  <td className="border-[2px] border-black p-3 font-bold uppercase">{asgn.teacher.name}</td>
                  <td className={`border-[2px] border-black p-3 uppercase font-black ${!plan ? 'text-red-600' : ''}`}>
                    {plan ? plan.chapter : 'LESSON PLAN PENDING'}
                  </td>
                  <td className={`border-[2px] border-black p-3 whitespace-pre-wrap leading-tight font-semibold ${!plan ? 'text-red-600 italic' : ''}`}>
                    {plan ? plan.topics : 'No academic data submitted for the upcoming week.'}
                  </td>
                  <td className={`border-[2px] border-black p-3 whitespace-pre-wrap leading-tight font-medium ${!plan ? 'text-red-600 font-black' : ''}`}>
                    {plan ? plan.homework : 'PLAN PENDING'}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="border-2 border-black p-16 text-center text-slate-400 font-black uppercase tracking-widest italic text-xl">
                  No subject assignments found for Class {className}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Institutional Authentication */}
        <div className="mt-16 flex justify-between items-end px-6">
           <div className="text-center border-t-2 border-black pt-2 w-40 font-black text-[10px] uppercase tracking-tighter">Authorized Class Teacher</div>
           <div className="text-center border-t-2 border-black pt-2 w-40 font-black text-[10px] uppercase tracking-tighter">Academic Coordinator</div>
           <div className="text-center border-t-2 border-black pt-2 w-40 font-black text-[10px] uppercase tracking-tighter">Principal's Seal</div>
        </div>
      </div>
      
      <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase text-center tracking-[0.5em] print:hidden">
        Institutional Record • Sacred Heart Cloud Hub • Validated Digitally
      </div>
    </div>
  );
};

export default PrintableReport;
