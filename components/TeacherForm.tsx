
import React, { useState } from 'react';
import { Teacher, ClassName, SectionName, TeacherAssignment } from '../types';
import { getUpcomingMonday, getNextSaturday, formatDate } from '../utils';
import { Send, CheckCircle2, ChevronRight } from 'lucide-react';

interface TeacherFormProps {
  teacher: Teacher;
  onSubmit: (data: any) => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSubmit }) => {
  const upcomingMonday = getUpcomingMonday();
  const nextSaturday = getNextSaturday(upcomingMonday);

  // Filter unique assignments to avoid duplicate forms for sections if logic requires
  // Actually the requirement says "if teacher takes class 5, 6, 7 display in one go"
  // Let's group assignments by (Class, Subject) to fill once per subject-level
  const uniqueGroups = teacher.assignments.reduce((acc, curr) => {
    const key = `${curr.className}-${curr.subject}`;
    if (!acc[key]) {
      acc[key] = {
        className: curr.className,
        subject: curr.subject,
        sections: []
      };
    }
    // Fixed: TeacherAssignment uses 'sections' (array) instead of 'section'.
    acc[key].sections.push(...curr.sections);
    return acc;
  }, {} as Record<string, { className: ClassName, subject: string, sections: SectionName[] }>);

  const groupKeys = Object.keys(uniqueGroups);
  
  const [formData, setFormData] = useState<Record<string, any>>(
    groupKeys.reduce((acc, key) => ({
      ...acc,
      [key]: {
        chapter: '',
        topics: '',
        homework: ''
      }
    }), {})
  );

  const handleInputChange = (key: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = groupKeys.map(key => ({
      ...uniqueGroups[key],
      ...formData[key],
      dateFrom: formatDate(upcomingMonday),
      dateTo: formatDate(nextSaturday),
      weekStarting: upcomingMonday.toISOString(),
      submittedAt: new Date().toISOString()
    }));
    onSubmit(submission);
  };

  const colors = {
    'V': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    'VI': 'bg-sky-50 border-sky-200 text-sky-800',
    'VII': 'bg-purple-50 border-purple-200 text-purple-800'
  };

  const headerColors = {
    'V': 'text-emerald-600',
    'VI': 'text-sky-600',
    'VII': 'text-purple-600'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
          Weekly Lesson Plan Submission
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-slate-500">Starting Week (Monday)</p>
            <p className="font-semibold text-slate-800">{upcomingMonday.toLocaleDateString()}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-slate-500">Ending Week (Saturday)</p>
            <p className="font-semibold text-slate-800">{nextSaturday.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {groupKeys.map((key) => {
        const group = uniqueGroups[key];
        const colorClass = colors[group.className as ClassName] || 'bg-slate-50 border-slate-200 text-slate-800';
        const headerColor = headerColors[group.className as ClassName] || 'text-slate-600';

        return (
          <div key={key} className={`border rounded-2xl overflow-hidden shadow-sm bg-white`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${colorClass}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Class {group.className} <ChevronRight className="h-4 w-4" /> {group.subject}
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded">
                Sections: {group.sections.join(', ')}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name of the Chapter <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter chapter name..."
                  value={formData[key].chapter}
                  onChange={(e) => handleInputChange(key, 'chapter', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Topics/Subtopics to be taught <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="List the key topics..."
                  value={formData[key].topics}
                  onChange={(e) => handleInputChange(key, 'topics', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Proposed Home Work <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Detail the homework assignments..."
                  value={formData[key].homework}
                  onChange={(e) => handleInputChange(key, 'homework', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-6 flex justify-end">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-indigo-200 transform hover:-translate-y-1 transition-all flex items-center gap-2 group"
        >
          Submit All Lesson Plans
          <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
