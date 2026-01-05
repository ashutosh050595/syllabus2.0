import React, { useState, useEffect } from 'react';
import { 
  Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, Save, X 
} from 'lucide-react';
import { Teacher, LessonPlan, Assignment } from '../types';
import { APIService } from '../services/api';
import { INITIAL_TEACHERS } from '../constants';

interface AdminRegistryProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  onAddTeacher: (teacher: Teacher) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  onRemoveTeacher: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const AdminRegistry: React.FC<AdminRegistryProps> = ({ 
  teachers, 
  lessonPlans, 
  onAddTeacher, 
  onUpdateTeacher, 
  onRemoveTeacher,
  onRefresh 
}) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [seedComplete, setSeedComplete] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, 'sections'> & { sections: string }>({
    className: '10',
    subject: '',
    sections: ''
  });

  // Initialize edit form when editingTeacher changes
  useEffect(() => {
    if (editingTeacher) {
      setEditFormData({
        name: editingTeacher.name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        isClassTeacher: editingTeacher.isClassTeacher,
        classTeacherOf: editingTeacher.classTeacherOf,
        assignments: [...editingTeacher.assignments]
      });
    }
  }, [editingTeacher]);

  const handleSeed = async () => {
    if (!confirm(`Seed cloud faculty registry with ${INITIAL_TEACHERS.length} local records?\n\nThis will add all initial teachers to the database.`)) return;
    setIsSeeding(true);
    try {
      // First check if database is already seeded
      const currentTeachers = await APIService.fetchTeachers();
      if (currentTeachers.length > 0) {
        const shouldOverwrite = confirm(`Database already contains ${currentTeachers.length} teachers. Do you want to overwrite with initial teachers?`);
        if (!shouldOverwrite) return;
      }
      
      await APIService.syncInitialTeachers(INITIAL_TEACHERS);
      setSeedComplete(true);
      alert(`Success: ${INITIAL_TEACHERS.length} faculty members synchronized to cloud.`);
      await onRefresh();
    } catch (e) {
      console.error("Seed error:", e);
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSendWarnings = async () => {
    if (!confirm("Send automated email reminders to all teachers who haven't submitted plans for next week?")) return;
    setIsSendingAlerts(true);
    try {
      await APIService.triggerDefaulterReminders();
      alert("Warning protocol initiated via Google Apps Script.");
    } catch (e) {
      alert("Failed to trigger warnings.");
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher || !editFormData) return;
    
    try {
      await onUpdateTeacher(editingTeacher.id, editFormData);
      setIsEditing(false);
      setEditingTeacher(null);
      setEditFormData({});
      alert("Teacher information updated successfully!");
    } catch (error) {
      alert("Failed to update teacher. Please try again.");
    }
  };

  const handleAddAssignment = () => {
    if (!newAssignment.subject.trim() || !newAssignment.sections.trim()) {
      alert("Please enter both subject and sections.");
      return;
    }

    const sectionsArray = newAssignment.sections.split(',').map(s => s.trim()).filter(s => s);
    
    const assignment: Assignment = {
      className: newAssignment.className,
      subject: newAssignment.subject,
      sections: sectionsArray
    };

    setEditFormData(prev => ({
      ...prev,
      assignments: [...(prev.assignments || []), assignment]
    }));

    // Reset new assignment form
    setNewAssignment({
      className: '10',
      subject: '',
      sections: ''
    });
  };

  const handleRemoveAssignment = (index: number) => {
    if (!editFormData.assignments) return;
    
    const updatedAssignments = [...editFormData.assignments];
    updatedAssignments.splice(index, 1);
    
    setEditFormData(prev => ({
      ...prev,
      assignments: updatedAssignments
    }));
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      {/* Edit Teacher Modal */}
      {isEditing && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Edit Teacher</h3>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                  Update teacher information
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditingTeacher(null);
                  setEditFormData({});
                }}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                    Class Teacher
                  </label>
                  <select
                    value={editFormData.isClassTeacher ? 'yes' : 'no'}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      isClassTeacher: e.target.value === 'yes' 
                    }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Assignments Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400">
                    Teaching Assignments
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {editFormData.assignments?.length || 0} assignments
                  </span>
                </div>
                
                {/* Add New Assignment Form */}
                <div className="bg-slate-50 p-4 rounded-xl mb-4">
                  <h4 className="text-sm font-black text-slate-700 mb-3">Add New Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <select
                        value={newAssignment.className}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, className: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none"
                      >
                        <option value="10">Grade 10</option>
                        <option value="9">Grade 9</option>
                        <option value="8">Grade 8</option>
                        <option value="7">Grade 7</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Subject"
                        value={newAssignment.subject}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Sections (comma separated)"
                        value={newAssignment.sections}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, sections: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none"
                      />
                      <button
                        onClick={handleAddAssignment}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Assignments List */}
                <div className="space-y-2">
                  {editFormData.assignments?.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-sm font-bold text-slate-900">{assignment.subject}</span>
                        <div className="text-[10px] text-slate-500">
                          Grade {assignment.className} • Sections: {assignment.sections.join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(index)}
                        className="p-1 text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {(!editFormData.assignments || editFormData.assignments.length === 0) && (
                    <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-400 text-sm">No assignments added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingTeacher(null);
                  setEditFormData({});
                }}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Faculty Registry</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            {teachers.length} teachers in database
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <button 
            onClick={handleSendWarnings}
            disabled={isSendingAlerts}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isSendingAlerts ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            Send Warnings
          </button>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isSeeding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CloudUpload className="h-3 w-3" />
            )}
            {isSeeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold mb-2">No teachers found in database</p>
          <p className="text-[10px] text-slate-300 mb-6">Click "Seed Database" to populate the faculty registry</p>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            {isSeeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Faculty Member</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Assignments</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachers.map(teacher => (
                <tr key={teacher.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-4">
                    <div className="font-black text-slate-900 italic">{teacher.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{teacher.email}</div>
                    <div className="text-[8px] text-slate-300 font-bold">{teacher.phone}</div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {teacher.assignments.map((asgn, idx) => (
                        <span key={idx} className="text-[8px] font-black bg-white border border-slate-200 text-indigo-600 px-2 py-0.5 rounded uppercase">
                          {asgn.subject} ({asgn.className})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    {teacher.isClassTeacher ? (
                      <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase">
                        CT {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}
                      </span>
                    ) : (
                      <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase">Faculty</span>
                    )}
                  </td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(teacher)}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors hover:bg-indigo-50"
                        title="Edit teacher"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onRemoveTeacher(teacher.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors hover:bg-rose-50"
                        title="Remove teacher"
                      >
                        <Trash2 className="h-4 w-4" />
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
