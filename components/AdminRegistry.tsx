
import React, { useState } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName, TeacherAssignment } from '../types';
import { getUpcomingMonday } from '../utils';
import { 
  Search, Edit2, Trash2, Plus, X, 
  Users, CheckCircle2, AlertTriangle, Activity, Mail
} from 'lucide-react';

interface AdminRegistryProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => void;
  onRemoveTeacher: (id: string) => void;
}

const CLASSES: ClassName[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS: SectionName[] = ['A', 'B', 'C', 'D'];
const DEFAULT_PASS = 'shstelaiya@123';

const AdminRegistry: React.FC<AdminRegistryProps> = ({ teachers, lessonPlans, onAddTeacher, onUpdateTeacher, onRemoveTeacher }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const upcomingMonday = getUpcomingMonday().toISOString();
  const currentWeekPlans = lessonPlans.filter(p => p.weekStarting === upcomingMonday);
  const submittedTeacherIds = new Set(currentWeekPlans.map(p => p.teacherId));
  const defaulters = teachers.filter(t => !submittedTeacherIds.has(t.id));

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: DEFAULT_PASS, isClassTeacher: false, ctClass: 'V' as ClassName, ctSection: 'A' as SectionName,
    assignments: [{ className: 'V' as ClassName, sections: [] as SectionName[], subject: '' }] as TeacherAssignment[]
  });

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', password: DEFAULT_PASS, isClassTeacher: false, ctClass: 'V' as ClassName, ctSection: 'A' as SectionName,
      assignments: [{ className: 'V' as ClassName, sections: [] as SectionName[], subject: '' }]
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return alert("Name and Email are required.");
    
    const teacher: Teacher = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: formData.name, email: formData.email, phone: formData.phone, password: formData.password,
      isClassTeacher: formData.isClassTeacher,
      classTeacherOf: formData.isClassTeacher ? { className: formData.ctClass, section: formData.ctSection } : undefined,
      assignments: formData.assignments
    };
    
    if (editingId) onUpdateTeacher(editingId, teacher);
    else onAddTeacher(teacher);
    resetForm();
  };

  const addAssignment = () => {
    setFormData({...formData, assignments: [...formData.assignments, { className: 'V', sections: [], subject: '' }]});
  };

  const removeAssignment = (idx: number) => {
    setFormData({...formData, assignments: formData.assignments.filter((_, i) => i !== idx)});
  };

  const toggleSection = (assignmentIdx: number, section: SectionName) => {
    const updated = [...formData.assignments];
    const currentSections = updated[assignmentIdx].sections;
    if (currentSections.includes(section)) {
      updated[assignmentIdx].sections = currentSections.filter(s => s !== section);
    } else {
      updated[assignmentIdx].sections = [...currentSections, section];
    }
    setFormData({...formData, assignments: updated});
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Admin Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Faculty</p>
            <p className="text-2xl font-black text-slate-900">{teachers.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submissions This Week</p>
            <p className="text-2xl font-black text-slate-900">{submittedTeacherIds.size}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-rose-100 p-4 rounded-2xl text-rose-600"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Defaulters</p>
            <p className="text-2xl font-black text-slate-900">{defaulters.length}</p>
          </div>
        </div>
      </div>

      {/* Defaulters Alert */}
      {defaulters.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
          <h4 className="text-rose-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Pending Weekly Submissions
          </h4>
          <div className="flex flex-wrap gap-2">
            {defaulters.map(t => (
              <div key={t.id} className="bg-white border border-rose-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600"><Mail className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-900">{t.name}</p>
                  <p className="text-[9px] text-rose-500 font-bold">{t.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search faculty by name or email..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" /> Add New Teacher
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black italic">Teacher Registry - {editingId ? 'Edit Profile' : 'New Entry'}</h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-900"><X className="h-6 w-6" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Full Name</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Teacher's Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Email (Auth Key)</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Phone</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Password</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
                <input type="checkbox" id="ct-check" checked={formData.isClassTeacher} onChange={e => setFormData({...formData, isClassTeacher: e.target.checked})} className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="ct-check" className="font-black text-sm text-slate-900 uppercase tracking-tight">Appoint as Class Teacher</label>
             </div>
             {formData.isClassTeacher && (
               <div className="flex gap-4">
                  <select className="px-4 py-2 bg-white border rounded-xl font-bold" value={formData.ctClass} onChange={e => setFormData({...formData, ctClass: e.target.value as ClassName})}>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <select className="px-4 py-2 bg-white border rounded-xl font-bold" value={formData.ctSection} onChange={e => setFormData({...formData, ctSection: e.target.value as SectionName})}>
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
               </div>
             )}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject Assignments</h4>
            {formData.assignments.map((asgn, i) => (
              <div key={i} className="flex flex-wrap gap-4 items-end p-4 bg-white border border-slate-200 rounded-2xl">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Class</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-bold" value={asgn.className} onChange={e => {
                      const upd = [...formData.assignments]; upd[i].className = e.target.value as ClassName; setFormData({...formData, assignments: upd});
                    }}>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1 flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black uppercase text-slate-400">Sections</label>
                    <div className="flex gap-2">
                      {SECTIONS.map(s => (
                        <button key={s} onClick={() => toggleSection(i, s)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${asgn.sections.includes(s) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{s}</button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-1 flex-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Subject</label>
                    <input className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-bold" placeholder="e.g. Maths" value={asgn.subject} onChange={e => {
                      const upd = [...formData.assignments]; upd[i].subject = e.target.value; setFormData({...formData, assignments: upd});
                    }} />
                 </div>
                 <button onClick={() => removeAssignment(i)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
            <button onClick={addAssignment} className="text-xs font-black text-indigo-600 flex items-center gap-2 hover:translate-x-1 transition-transform uppercase tracking-widest"><Plus className="h-4 w-4" /> Add Assignment Row</button>
          </div>

          <div className="mt-10 flex justify-end gap-3 border-t pt-8">
             <button onClick={resetForm} className="px-8 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Discard Changes</button>
             <button onClick={handleSave} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-indigo-200 transition-all active:scale-95">Sync with Registry</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Name & Registry ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Admin Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{t.name[0]}</div>
                    <div>
                      <p className="font-black text-slate-900">{t.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {t.isClassTeacher && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">CT: {t.classTeacherOf?.className}-{t.classTeacherOf?.section}</span>}
                    {t.assignments.map((a, i) => <span key={i} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold">{a.className}: {a.subject}</span>)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {submittedTeacherIds.has(t.id) ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest"><CheckCircle2 className="h-3 w-3" /> Submitted</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400 font-black text-[10px] uppercase tracking-widest"><AlertTriangle className="h-3 w-3" /> Pending</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => { 
                      setEditingId(t.id); 
                      setFormData({
                        name: t.name, email: t.email, phone: t.phone, password: t.password || DEFAULT_PASS,
                        isClassTeacher: t.isClassTeacher,
                        ctClass: t.classTeacherOf?.className || 'V',
                        ctSection: t.classTeacherOf?.section || 'A',
                        assignments: t.assignments
                      });
                      setIsAdding(false);
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => onRemoveTeacher(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 && <div className="p-20 text-center"><p className="text-slate-400 italic font-bold">No faculty records found in the registry.</p></div>}
      </div>
    </div>
  );
};

export default AdminRegistry;
