
import React, { useState } from 'react';
import { Teacher, LessonPlan, ClassName, SectionName, TeacherAssignment } from '../types';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from '../constants';
import { APIService } from '../services/api';
import { getUpcomingMonday } from '../utils';
import { Search, Edit2, Trash2, Plus, X, Users, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

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
  const defaulters = teachers.filter(t => !submittedTeacherIds.has(t.email));

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
    if (!confirm("Seed cloud faculty registry from local institutional constants?")) return;
    setIsSeeding(true);
    try {
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      alert("Faculty registry successfully synchronized.");
      resetForm();
    } catch (e) {
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return alert("Name and Email are required.");
    const teacher: Teacher = {
      id: editingId || `t-${Math.random().toString(36).substr(2, 5)}`,
      name: formData.name, email: formData.email, phone: formData.phone, password: formData.password,
      isClassTeacher: formData.isClassTeacher,
      classTeacherOf: formData.isClassTeacher ? { className: formData.ctClass, section: formData.ctSection } : undefined,
      assignments: formData.assignments
    };
    if (editingId) await onUpdateTeacher(editingId, teacher);
    else await onAddTeacher(teacher);
    resetForm();
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-indigo-50 p-4 rounded-2xl"><Users className="h-6 w-6 text-indigo-600" /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Faculty</p><p className="text-2xl font-black text-slate-900 leading-none">{teachers.length}</p></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-emerald-50 p-4 rounded-2xl"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Compliant</p><p className="text-2xl font-black text-slate-900 leading-none">{teachers.length - defaulters.length}</p></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-rose-50 p-4 rounded-2xl"><AlertTriangle className="h-6 w-6 text-rose-600" /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Defaulters</p><p className="text-2xl font-black text-slate-900 leading-none">{defaulters.length}</p></div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search faculty..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:border-indigo-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={handleSeed} disabled={isSeeding} className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"><Database className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} /> Sync Local Registry</button>
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"><Plus className="h-4 w-4" /> Add Member</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-indigo-600 italic shadow-sm">{teacher.name.charAt(0)}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(teacher.id); setFormData({ name: teacher.name, email: teacher.email, phone: teacher.phone, password: teacher.password || DEFAULT_TEACHER_PASSWORD, isClassTeacher: teacher.isClassTeacher, ctClass: teacher.classTeacherOf?.className || 'V', ctSection: teacher.classTeacherOf?.section || 'A', assignments: teacher.assignments }); setIsAdding(true); }} className="p-2 bg-white rounded-lg border border-slate-200 hover:text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => onRemoveTeacher(teacher.id)} className="p-2 bg-white rounded-lg border border-slate-200 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h4 className="font-black text-slate-900 leading-tight uppercase tracking-tight">{teacher.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold mb-3">{teacher.email}</p>
              <div className="flex flex-wrap gap-1">
                {teacher.isClassTeacher && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase border border-emerald-200">CT: {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}</span>}
                {teacher.assignments.map((asgn, idx) => ( <span key={idx} className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase border border-indigo-100">{asgn.subject} ({asgn.className})</span> ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 bg-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-xl font-black italic uppercase tracking-tight">{editingId ? 'Edit Faculty' : 'New Faculty Admission'}</h3>
              <button onClick={resetForm} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Full Name" className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Email" className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input type="checkbox" className="w-5 h-5" checked={formData.isClassTeacher} onChange={e => setFormData({...formData, isClassTeacher: e.target.checked})} />
                <span className="text-xs font-black uppercase text-slate-700">Designated Class Teacher</span>
                {formData.isClassTeacher && (
                  <div className="flex gap-2 ml-auto">
                    <select className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={formData.ctClass} onChange={e => setFormData({...formData, ctClass: e.target.value as ClassName})}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={formData.ctSection} onChange={e => setFormData({...formData, ctSection: e.target.value as SectionName})}>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignments</label><button onClick={() => setFormData({...formData, assignments: [...formData.assignments, { className: 'V', sections: [], subject: '' }]})} className="text-indigo-600 font-black text-[10px] uppercase flex items-center gap-1"><Plus className="h-3 w-3" /> Add Assignment</button></div>
                {formData.assignments.map((asgn, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap gap-3 items-center">
                    <select className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black" value={asgn.className} onChange={e => { const upd = [...formData.assignments]; upd[idx].className = e.target.value as ClassName; setFormData({...formData, assignments: upd}); }}>{CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
                    <input placeholder="Subject" className="flex-grow px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-indigo-500" value={asgn.subject} onChange={e => { const upd = [...formData.assignments]; upd[idx].subject = e.target.value; setFormData({...formData, assignments: upd}); }} />
                    <div className="flex gap-1"> {SECTIONS.map(s => ( <button key={s} onClick={() => { const upd = [...formData.assignments]; const scts = upd[idx].sections; upd[idx].sections = scts.includes(s) ? scts.filter(x => x !== s) : [...scts, s]; setFormData({...formData, assignments: upd}); }} className={`w-8 h-8 rounded-lg text-[10px] font-black ${asgn.sections.includes(s) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>{s}</button> ))} </div>
                    <button onClick={() => setFormData({...formData, assignments: formData.assignments.filter((_, i) => i !== idx)})} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 pt-0">
              <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-50 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all">{editingId ? 'Apply Amendments' : 'Confirm Registration'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistry;
