
import React, { useState } from 'react';
import { Printer, Share2, Download, Filter, FileText, ChevronRight } from 'lucide-react';
import { LessonPlan, Teacher, ClassName, SectionName } from '../types';
import { getUpcomingMonday } from '../utils';
import PrintableReport from './PrintableReport';

interface AdminCompilerProps {
  lessonPlans: LessonPlan[];
  teachers: Teacher[];
}

const AdminCompiler: React.FC<AdminCompilerProps> = ({ lessonPlans, teachers }) => {
  const upcomingMonday = getUpcomingMonday();
  const weekLabel = upcomingMonday.toISOString();

  const [selectedClass, setSelectedClass] = useState<ClassName>('VI');
  const [selectedSection, setSelectedSection] = useState<SectionName>('A');
  const [showPreview, setShowPreview] = useState(true);

  const classes: ClassName[] = ['V', 'VI', 'VII'];
  const sections: SectionName[] = ['A', 'B', 'C', 'D'];

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = `Weekly Syllabus for Class ${selectedClass}-${selectedSection} (${upcomingMonday.toLocaleDateString()}) is ready for review.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Controls Card */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 print-hidden">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <Printer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Report Compiler</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">Generate & Distribute Weekly Syllabus</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {classes.map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedClass(c)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedClass === c ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                CLASS {c}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {sections.map(s => (
              <button 
                key={s} 
                onClick={() => setSelectedSection(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedSection === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block" />

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
          
          <button 
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex justify-center">
        <div id="report-preview" className="bg-white shadow-2xl rounded-sm overflow-hidden scale-[0.85] origin-top md:scale-100">
          <PrintableReport 
            className={selectedClass}
            sectionName={selectedSection}
            plans={lessonPlans}
            teachers={teachers}
            weekStarting={weekLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCompiler;
