
import React, { useState } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName, TeacherAssignment } from '../types';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from '../constants';
import { APIService } from '../services/api';
import { getUpcomingMonday } from '../utils';
import { 
  Search, Edit2, Trash2, Plus, X, 
  Users, CheckCircle2, AlertTriangle, Activity, Mail, Database, RefreshCw
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

const AdminRegistry: React.FC<AdminRegistryProps> = ({ teachers, lessonPlans, onAddTeacher, onUpdateTeacher, onRemoveTeacher }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const upcomingMonday = getUpcomingMonday().toISOString();
  const currentWeekPlans = lessonPlans.filter(p => p.weekStarting === upcomingMonday);
  const submittedTeacherIds = new Set(currentWeekPlans.map(p => p.teacherId));
  const defaulters = teachers.filter(t => !submittedTeacherIds.has(t.id));

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: DEFAULT_TEACHER_PASSWORD, isClassTeacher: false, ctClass: 'V' as ClassName, ctSection: 'A' as SectionName,
    assignments: [{ className: 'V' as ClassName, sections: [] as SectionName[], subject: '' }] as TeacherAssignment[]
  });

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', password: DEFAULT_TEACHER_PASSWORD, isClassTeacher: false, ctClass: 'V' as ClassName, ctSection: 'A' as SectionName,
      assignments: [{ className: 'V' as ClassName, sections: [] as SectionName[], subject: '' }]
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSeed = async () => {
    if (!confirm("This will synchronize the default teacher registry to the cloud. Existing matches will be updated. Continue?")) return;
    setIsSeeding(true);
    try {
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      alert("Faculty registry successfully seeded.");
      window.location.reload();
    } catch (e) {
      alert("Error seeding registry: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return alert("Required: Please provide a name and email.");
    
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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Dashboard KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Faculty</p>
            <p className="text-2xl font-black text-slate-900">{teachers.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Received</p>
            <p className="text-2xl font-black text-slate-900">{submittedTeacherIds.size} / {teachers.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="bg-rose-100 p-4 rounded-2xl text-rose-600"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defaulters</p>
            <p className="text-2xl font-black text-slate-900">{defaulters.length}</p>
          </div>
        </div>
      </div>

      {/* Submission Defaulters Alert */}
      {defaulters.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl animate-in slide-in-from-top-4">
          <h4 className="text-rose-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Pending Weekly Submissions
          </h4>
          <div className="flex flex-wrap gap-2">
            {defaulters.map(t => (
              <div key={t.id} className="bg-white border border-rose-200 p-3 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-[10px]">{t.name[0]}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 leading-none">{t.name}</p>
                  <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-tight">{t.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar: Search & Seed Tools */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by name or email..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {/* RESTORED: Seed Registry Button */}
          <button onClick={handleSeed} disabled={isSeeding} className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95">
            {isSeeding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Seed Registry
          </button>
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-50 transition-all">
            <Plus className="h-4 w-4" /> Add Teacher
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-2xl animate-in slide-in-from-top-6 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black italic text-indigo-900">Teacher Profile & Assignment Suite</h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X className="h-6 w-6" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Faculty Name</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Auth Email</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Institutional Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Phone</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Contact No" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Portal Password</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
             <div className="flex items-center gap-4 mb-4">
                <input type="checkbox" id="ct-check" checked={formData.isClassTeacher} onChange={e => setFormData({...formData, isClassTeacher: e.target.checked})} className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="ct-check" className="font-black text-sm text-slate-900 uppercase tracking-tight">Appoint as Class Teacher</label>
             </div>
             {formData.isClassTeacher && (
               <div className="flex gap-4">
                  <select className="px-4 py-2 bg-white border border-indigo-200 rounded-xl font-bold" value={formData.ctClass} onChange={e => setFormData({...formData, ctClass: e.target.value as ClassName})}>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <select className="px-4 py-2 bg-white border border-indigo-200 rounded-xl font-bold" value={formData.ctSection} onChange={e => setFormData({...formData, ctSection: e.target.value as SectionName})}>
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
               </div>
             )}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject Specialist Assignments</h4>
            {formData.assignments.map((asgn, i) => (
              <div key={i} className="flex flex-wrap gap-4 items-end p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                 <div className="space-y-1 flex-none w-32">
                    <label className="text-[9px] font-black uppercase text-slate-400">Class</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg font-bold" value={asgn.className} onChange={e => {
                      const upd = [...formData.assignments]; upd[i].className = e.target.value as ClassName; setFormData({...formData, assignments: upd});
                    }}>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1 flex-1 min-w-[220px]">
                    <label className="text-[9px] font-black uppercase text-slate-400">Assigned Sections</label>
                    <div className="flex gap-1.5">
                      {SECTIONS.map(s => (
                        <button key={s} onClick={() => toggleSection(i, s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${asgn.sections.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-400'}`}>{s}</button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-1 flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black uppercase text-slate-400">Subject Specialist</label>
                    <input className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg font-bold" placeholder="e.g. Maths" value={asgn.subject} onChange={e => {
                      const upd = [...formData.assignments]; upd[i].subject = e.target.value; setFormData({...formData, assignments: upd});
                    }} />
                 </div>
                 <button onClick={() => removeAssignment(i)} className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors bg-slate-50 rounded-xl"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
            <button onClick={addAssignment} className="text-xs font-black text-indigo-600 flex items-center gap-2 hover:translate-x-2 transition-transform uppercase tracking-widest pt-2"><Plus className="h-4 w-4" /> Add Row</button>
          </div>

          <div className="mt-12 flex justify-end gap-3 border-t pt-10">
             <button onClick={resetForm} className="px-10 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Discard Entry</button>
             <button onClick={handleSave} className="bg-indigo-900 text-white px-14 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:shadow-indigo-100 transition-all active:scale-95">Commit Registry Update</button>
          </div>
        </div>
      )}

      {/* Main Registry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignments</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Week Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg border border-slate-200">{t.name[0]}</div>
                    <div>
                      <p className="font-black text-slate-900 text-base">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-wrap gap-1.5 max-w-md">
                    {t.isClassTeacher && <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase border border-indigo-100">CT {t.classTeacherOf?.className}-{t.classTeacherOf?.section}</span>}
                    {t.assignments.map((a, i) => (
                      <span key={i} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-xl text-[9px] font-bold border border-slate-100">
                        {a.className}: {a.subject} ({a.sections.join(',')})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex justify-center">
                    {submittedTeacherIds.has(t.id) ? (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border border-emerald-100 shadow-sm"><CheckCircle2 className="h-3 w-3" /> Submitted</div>
                    ) : (
                      <div className="flex items-center gap-2 bg-rose-50 text-rose-400 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border border-rose-100"><AlertTriangle className="h-3 w-3" /> Pending</div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { 
                      setEditingId(t.id); 
                      setFormData({
                        name: t.name, email: t.email, phone: t.phone, password: t.password || DEFAULT_TEACHER_PASSWORD,
                        isClassTeacher: t.isClassTeacher,
                        ctClass: t.classTeacherOf?.className || 'V',
                        ctSection: t.classTeacherOf?.section || 'A',
                        assignments: t.assignments
                      });
                      setIsAdding(false);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 className="h-4.5 w-4.5" /></button>
                    <button onClick={() => onRemoveTeacher(t.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-4.5 w-4.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 && <div className="p-24 text-center"><p className="text-slate-400 italic font-black uppercase tracking-[0.2em]">Registry is Empty • Use Seed Button Above</p></div>}
      </div>
    </div>
  );
};

export default AdminRegistry;
