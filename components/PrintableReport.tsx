
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
  endDate.setDate(startDate.getDate() + 5); // saturday

  const dateStr = `${startDate.getDate()}-${startDate.toLocaleString('default', { month: 'short' })}-${startDate.getFullYear()} to ${endDate.getDate()}-${endDate.toLocaleString('default', { month: 'short' })}-${endDate.getFullYear()}`;

  const sectionTeacher = teachers.find(t => 
    t.isClassTeacher && 
    t.classTeacherOf?.className === className && 
    t.classTeacherOf?.section === sectionName
  );

  const targetAssignments: Array<{ teacher: Teacher, subject: string }> = [];
  teachers.forEach(t => {
    t.assignments.forEach(asgn => {
      if (asgn.className === className && asgn.sections.includes(sectionName)) {
        targetAssignments.push({ teacher: t, subject: asgn.subject });
      }
    });
  });

  targetAssignments.sort((a, b) => a.subject.localeCompare(b.subject));

  return (
    <div className="bg-white text-black p-0 w-full font-serif" id="report-preview" style={{ minHeight: '297mm', width: '210mm', padding: '15mm', margin: '0 auto' }}>
      <div className="border-[1.5px] border-black p-10 h-full relative">
        {/* Header Block */}
        <div className="text-center mb-10">
           <div className="flex justify-center items-center gap-6 mb-4">
              <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-20 h-20 object-contain" />
              <div className="text-center">
                <h1 className="text-[28px] font-bold uppercase leading-none mb-1" style={{ fontFamily: 'serif' }}>SACRED HEART SCHOOL</h1>
                <p className="text-[12px] font-bold italic opacity-80">(Affiliated to CBSE, New Delhi, upto +2 Level)</p>
                <p className="text-[12px] font-bold italic opacity-80">Jhumri Telaiya, Koderma</p>
              </div>
           </div>
           <div className="border-y border-black py-1 mb-4">
             <h2 className="text-[18px] font-bold uppercase underline tracking-[0.25em]">WEEKLY SYLLABUS</h2>
           </div>
        </div>

        {/* Info Bar */}
        <div className="space-y-1.5 mb-8 text-[14px]">
          <div className="flex items-center"><span className="w-52 font-bold uppercase">Date Period</span><span className="font-bold">: {dateStr}</span></div>
          <div className="flex items-center"><span className="w-52 font-bold uppercase">Class & Section</span><span className="font-bold">: {className} {sectionName}</span></div>
          <div className="flex items-center"><span className="w-52 font-bold uppercase">Class In-charge</span><span className="font-bold">: {sectionTeacher?.name || '----------------------------'}</span></div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border border-black text-[12px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2.5 text-left w-28 font-bold uppercase">Subject</th>
              <th className="border border-black p-2.5 text-left w-36 font-bold uppercase">Subject Teacher</th>
              <th className="border border-black p-2.5 text-left w-40 font-bold uppercase">Chapter Name</th>
              <th className="border border-black p-2.5 text-left font-bold uppercase">Topics Covered</th>
              <th className="border border-black p-2.5 text-left w-52 font-bold uppercase">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {targetAssignments.map((asgn, idx) => {
              const plan = plans.find(p => 
                p.teacherId === asgn.teacher.id && 
                p.className === className && 
                p.section === sectionName && 
                p.subject === asgn.subject &&
                p.weekStarting === weekStarting
              );

              return (
                <tr key={idx} className="align-top min-h-[90px]">
                  <td className="border border-black p-2.5 font-bold">{asgn.subject}</td>
                  <td className="border border-black p-2.5">{asgn.teacher.name}</td>
                  <td className={`border border-black p-2.5 ${!plan ? 'text-red-600 font-bold italic' : 'font-semibold'}`}>
                    {plan ? plan.chapter : 'PENDING'}
                  </td>
                  <td className={`border border-black p-2.5 whitespace-pre-wrap leading-tight ${!plan ? 'text-red-500 italic' : ''}`}>
                    {plan ? plan.topics : 'Weekly plan not yet submitted by faculty.'}
                  </td>
                  <td className={`border border-black p-2.5 whitespace-pre-wrap leading-tight ${!plan ? 'text-red-600 font-bold italic' : ''}`}>
                    {plan ? plan.homework : 'Homework Pending'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Signatures */}
        <div className="mt-24 flex justify-between font-bold text-[14px]">
           <div className="text-center">
              <div className="w-48 border-t border-black pt-2">
                CLASS TEACHER
              </div>
           </div>
           <div className="text-center">
              <div className="w-48 border-t border-black pt-2">
                CO-ORDINATOR
              </div>
           </div>
           <div className="text-center">
              <div className="w-48 border-t border-black pt-2">
                PRINCIPAL
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Fixed: Added missing default export to satisfy AdminCompiler.tsx import
export default PrintableReport;
