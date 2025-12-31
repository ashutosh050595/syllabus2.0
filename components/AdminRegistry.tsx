
import React, { useState, useEffect } from 'react';
import { Teacher, ClassName, SectionName, TeacherAssignment } from '../types';
import { INITIAL_TEACHERS } from '../constants';
import { APIService } from '../services/api';
import { 
  UserPlus, Search, Edit2, Trash2, Mail, Phone, User, Plus, X, 
  Check, Database, RefreshCw, AlertCircle, Info, ShieldCheck 
} from 'lucide-react';

interface AdminRegistryProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => void;
  onRemoveTeacher: (id: string) => void;
}

const CLASSES: ClassName[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS: SectionName[] = ['A', 'B', 'C', 'D'];

const AdminRegistry: React.FC<AdminRegistryProps> = ({ teachers, onAddTeacher, onUpdateTeacher, onRemoveTeacher }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    isClassTeacher: boolean;
    ctClass: ClassName;
    ctSection: SectionName;
    assignments: TeacherAssignment[];
  }>({
    name: '',
    email: '',
    phone: '',
    isClassTeacher: false,
    ctClass: 'V',
    ctSection: 'A',
    assignments: [{ className: 'V', sections: [], subject: '' }]
  });

  const handleSeed = async () => {
    if (confirm("This will push the sample roster to your Firebase database. Continue?")) {
      setIsSeeding(true);
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      window.location.reload(); // Refresh to reflect new data
    }
  };

  const handleAddAssignment = () => {
    setFormData(prev => ({
      ...prev,
      assignments: [...prev.assignments, { className: 'V', sections: [], subject: '' }]
    }));
  };

  const handleRemoveAssignment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index)
    }));
  };

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: any) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData(prev => ({ ...prev, assignments: newAssignments }));
  };

  const toggleSection = (index: number, section: SectionName) => {
    const currentSections = formData.assignments[index].sections;
    const newSections = currentSections.includes(section)
      ? currentSections.filter(s => s !== section)
      : [...currentSections, section];
    updateAssignment(index, 'sections', newSections);
  };

  const selectAllSections = (index: number) => {
    updateAssignment(index, 'sections', [...SECTIONS]);
  };

  const handleSave = () => {
    const teacher: Teacher = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      isClassTeacher: formData.isClassTeacher,
      classTeacherOf: formData.isClassTeacher ? { className: formData.ctClass, section: formData.ctSection } : undefined,
      assignments: formData.assignments
    };

    if (editingId) {
      onUpdateTeacher(editingId, teacher);
      setEditingId(null);
    } else {
      onAddTeacher(teacher);
    }
    
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      isClassTeacher: false,
      ctClass: 'V',
      ctSection: 'A',
      assignments: [{ className: 'V', sections: [], subject: '' }]
    });
  };

  const startEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      isClassTeacher: teacher.isClassTeacher,
      ctClass: teacher.classTeacherOf?.className || 'V',
      ctSection: teacher.classTeacherOf?.section || 'A',
      assignments: teacher.assignments
    });
    setIsAdding(true);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          {teachers.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20"
            >
              {isSeeding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Seed Sample Roster
            </button>
          )}
          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              } else {
                setIsAdding(true);
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/20"
          >
            {isAdding ? 'Cancel' : <><UserPlus className="h-4 w-4" /> Add Teacher</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600" />
            {editingId ? 'Modify Professional Profile' : 'Teacher Registration'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Teacher Name" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@sacredheart.org" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Phone / WhatsApp</label>
              <input 
                type="tel" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="10-digit mobile" 
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-2xl mb-8 border border-indigo-100">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formData.isClassTeacher}
                  onChange={e => setFormData(prev => ({ ...prev, isClassTeacher: e.target.checked }))}
                />
                <span className="font-black text-slate-700 uppercase text-xs tracking-widest">Assign Class Teacher Role</span>
              </label>
              
              {formData.isClassTeacher && (
                <div className="flex gap-3 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-400">CLASS:</span>
                    <select 
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                      value={formData.ctClass}
                      onChange={e => setFormData(prev => ({ ...prev, ctClass: e.target.value as ClassName }))}
                    >
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-400">SEC:</span>
                    <select 
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                      value={formData.ctSection}
                      onChange={e => setFormData(prev => ({ ...prev, ctSection: e.target.value as SectionName }))}
                    >
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-3">Teaching Assignments Matrix</h4>
            {formData.assignments.map((assignment, index) => (
              <div key={index} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
                {formData.assignments.length > 1 && (
                  <button 
                    onClick={() => handleRemoveAssignment(index)}
                    className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition-colors shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject Configuration</label>
                    <div className="flex gap-3">
                      <select 
                        className="w-28 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={assignment.className}
                        onChange={e => updateAssignment(index, 'className', e.target.value)}
                      >
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Subject (e.g. Maths)"
                        className="flex-grow px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold uppercase placeholder:capitalize"
                        value={assignment.subject}
                        onChange={e => updateAssignment(index, 'subject', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Sections</label>
                      <button 
                        onClick={() => selectAllSections(index)}
                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-lg"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {SECTIONS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSection(index, s)}
                          className={`flex-1 py-3 rounded-xl border font-black text-xs transition-all ${
                            assignment.sections.includes(s)
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={handleAddAssignment}
              className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 bg-white hover:bg-indigo-50/20"
            >
              <Plus className="h-5 w-5" /> Expand Teaching Load
            </button>
          </div>

          <div className="mt-12 flex justify-end gap-4 pt-8 border-t border-slate-100">
             <button 
               onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
               className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
             >
               Discard Changes
             </button>
             <button 
               onClick={handleSave}
               className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
             >
               {editingId ? 'Sync Updates' : 'Authorize Faculty'}
             </button>
          </div>
        </div>
      )}

      {teachers.length === 0 ? (
        <div className="glass-card p-20 rounded-[4rem] text-center border-dashed border-indigo-500/30">
           <div className="bg-indigo-500/10 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <Info className="h-10 w-10 text-indigo-500" />
           </div>
           <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4">Database Empty</h3>
           <p className="text-slate-400 font-bold max-w-lg mx-auto mb-10">Your Cloud instance is active but no faculty members have been registered. Use the manual registration or push the sample roster to begin.</p>
           <button onClick={handleSeed} className="bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-3xl">Seed Initial Database</button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Faculty Identifier</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsibility</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loadout Matrix</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-5">
                      <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none text-lg tracking-tight italic">{teacher.name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><Mail className="h-3 w-3" /> {teacher.email}</span>
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><Phone className="h-3 w-3" /> {teacher.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {teacher.isClassTeacher ? (
                      <div className="flex flex-col">
                        <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" /> Class Teacher
                        </span>
                        <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-black border border-indigo-700 w-fit shadow-lg shadow-indigo-900/10">
                          {teacher.classTeacherOf?.className} — {teacher.classTeacherOf?.section}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-60">Subject Specialist</span>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-2.5 max-w-sm">
                      {teacher.assignments.map((a, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm group-hover:border-indigo-200 transition-colors">
                          <span className="text-[11px] font-black text-slate-900 tracking-tighter">{a.className} ({a.sections.join(',')})</span>
                          <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{a.subject}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => startEdit(teacher)}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                        title="Edit Record"
                      >
                        <Edit2 className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`CRITICAL: Are you sure you want to delete ${teacher.name}'s entire profile? This cannot be undone.`)) {
                            onRemoveTeacher(teacher.id);
                          }
                        }}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                        title="Purge Record"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRegistry;
