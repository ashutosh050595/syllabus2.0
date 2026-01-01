
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
  endDate.setDate(startDate.getDate() + 5); // Saturday

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
    <div className="bg-white text-black p-0 w-full font-serif print:m-0" style={{ minHeight: '297mm', width: '210mm', padding: '15mm' }}>
      <div className="border border-black p-8 h-full relative">
        {/* Header Block as per Screenshot */}
        <div className="text-center mb-10">
           <div className="flex justify-center items-center gap-4 mb-4">
              <img src="https://sacredheartkoderma.org/wp-content/uploads/2021/07/logo-150x150.png" alt="Logo" className="w-20 h-20 object-contain" />
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ fontFamily: 'serif' }}>SACRED HEART SCHOOL</h1>
                <p className="text-[12px] font-semibold italic">(Affiliated to CBSE, New Delhi, upto +2 Level)</p>
              </div>
           </div>
           <h2 className="text-xl font-bold uppercase underline tracking-widest mt-2">WEEKLY SYLLABUS</h2>
        </div>

        {/* Metadata section with bold labels */}
        <div className="space-y-1.5 mb-8 text-[14px]">
          <div className="flex items-baseline"><span className="w-48 font-bold">Date</span><span className="font-bold">: {dateStr}</span></div>
          <div className="flex items-baseline"><span className="w-48 font-bold">Class & Sec</span><span className="font-bold">: {className} {sectionName}</span></div>
          <div className="flex items-baseline"><span className="w-48 font-bold">Name of Class Teacher</span><span className="font-bold">: {sectionTeacher?.name || '-----------------'}</span></div>
        </div>

        {/* Table as per exact columns in screenshot */}
        <table className="w-full border-collapse border border-black text-[12px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-black p-2.5 text-left w-32 font-bold uppercase">Subject</th>
              <th className="border border-black p-2.5 text-left w-44 font-bold uppercase">Subject Teacher</th>
              <th className="border border-black p-2.5 text-left w-48 font-bold uppercase">Chapter Name</th>
              <th className="border border-black p-2.5 text-left font-bold uppercase">Topics/Sub-Topics</th>
              <th className="border border-black p-2.5 text-left w-64 font-bold uppercase">Home Assignments</th>
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
                <tr key={idx} className="align-top min-h-[100px]">
                  <td className="border border-black p-2.5 font-semibold">{asgn.subject}</td>
                  <td className="border border-black p-2.5">{asgn.teacher.name}</td>
                  <td className={`border border-black p-2.5 ${!plan ? 'text-red-600 font-black bg-red-50' : 'font-medium'}`}>
                    {plan ? plan.chapter : 'LESSON PLAN PENDING'}
                  </td>
                  <td className={`border border-black p-2.5 whitespace-pre-wrap leading-tight ${!plan ? 'text-red-500 italic' : ''}`}>
                    {plan ? plan.topics : 'Teachers have not submitted the syllabus for this period yet.'}
                  </td>
                  <td className={`border border-black p-2.5 whitespace-pre-wrap leading-tight ${!plan ? 'text-red-500 font-bold' : ''}`}>
                    {plan ? plan.homework : 'NOT ASSIGNED'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signatures at bottom */}
        <div className="absolute bottom-10 left-10 right-10 flex justify-between font-bold italic">
           <div className="border-t border-black pt-1 px-8">Class Teacher</div>
           <div className="border-t border-black pt-1 px-8">Principal</div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReport;
