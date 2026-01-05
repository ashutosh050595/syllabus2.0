import React, { useState, useEffect } from 'react';
import { 
  Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, Save, X, Plus, Eye, EyeOff, 
  Eye as EyeIcon, Database, FileText, AlertCircle, Download, Server
} from 'lucide-react';
import { useTeacherIdentity } from '../hooks/useTeacherIdentity';
import { Teacher, LessonPlan, Assignment } from '../types';
import { APIService } from '../services/api';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from '../constants';
import { normalizeEmail } from "../utils/identity";


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
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    phone: '',
    password: 'Teacher@2024',
    isClassTeacher: false,
    classTeacherOf: null,
    assignments: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
  const [showFirebaseData, setShowFirebaseData] = useState(false);
  const [firebaseTeachers, setFirebaseTeachers] = useState<Teacher[]>([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);

  useEffect(() => {
    if (editingTeacher) {
      setEditFormData({
        name: editingTeacher.name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        password: editingTeacher.password,
        isClassTeacher: editingTeacher.isClassTeacher,
        classTeacherOf: editingTeacher.classTeacherOf,
        assignments: [...editingTeacher.assignments]
      });
    }
  }, [editingTeacher]);

  // ✅ FIX: Prevent multiple concurrent seeding
  const handleSeed = async () => {
    if (isSeeding) {
      console.log("Seed operation already in progress, ignoring duplicate call");
      return;
    }

    if (!confirm(
      `Seed cloud faculty registry with ${INITIAL_TEACHERS.length} local records?\n\nThis will add all initial teachers to the database.`
    )) {
      return;
    }

    setIsSeeding(true);

    try {
      const currentTeachers = await APIService.fetchTeachers();

      if (currentTeachers.length > 0) {
        const shouldOverwrite = confirm(
          `Database already contains ${currentTeachers.length} teachers. Do you want to overwrite with initial teachers?`
        );

        if (!shouldOverwrite) {
          setIsSeeding(false);
          return;
        }

        await APIService.clearTeachersCollection();
      }

      await APIService.syncInitialTeachers(INITIAL_TEACHERS);

      alert(`Success: ${INITIAL_TEACHERS.length} faculty members synchronized to cloud.`);
      await onRefresh();
      setShowSeedPreview(false);
    } catch (e) {
      console.error("Seed error:", e);
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  // ✅ NEW FUNCTION: Load Firebase data and seed only if empty
  const handleLoadFirebaseData = async () => {
    setIsLoadingFirebase(true);
    try {
      // Directly fetch from Firebase (not from props)
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        // If Firebase has data, show it
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
        alert(`✅ Found ${currentFirebaseTeachers.length} teachers in Firebase database`);
      } else {
        // If Firebase is empty, ask to seed
        const shouldSeed = confirm(
          `Firebase database is empty. Do you want to seed with ${INITIAL_TEACHERS.length} initial teachers?`
        );
        
        if (shouldSeed) {
          setIsSeeding(true);
          await APIService.syncInitialTeachers(INITIAL_TEACHERS);
          const seededTeachers = await APIService.fetchTeachers();
          setFirebaseTeachers(seededTeachers);
          setShowFirebaseData(true);
          await onRefresh();
          alert(`✅ Successfully seeded ${INITIAL_TEACHERS.length} teachers to Firebase`);
        }
      }
    } catch (error) {
      console.error("Error loading Firebase data:", error);
      alert("Failed to load data from Firebase. Please check your connection.");
    } finally {
      setIsLoadingFirebase(false);
      setIsSeeding(false);
    }
  };

  // ✅ NEW FUNCTION: Load and display Firebase data without seeding
  const handleViewFirebaseData = async () => {
    setIsLoadingFirebase(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
      } else {
        alert("Firebase database is currently empty. Click 'Seed Database' to add initial teachers.");
      }
    } catch (error) {
      console.error("Error viewing Firebase data:", error);
      alert("Failed to fetch data from Firebase.");
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  // ✅ NEW FUNCTION: Smart seed - only seed if Firebase is empty
  const handleSmartSeed = async () => {
    if (isSeeding) return;
    
    setIsSeeding(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        // Show existing data
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
        alert(`⚠️ Firebase already contains ${currentFirebaseTeachers.length} teachers. Showing current data instead.`);
      } else {
        // Seed only if empty
        await APIService.syncInitialTeachers(INITIAL_TEACHERS);
        const seededTeachers = await APIService.fetchTeachers();
        setFirebaseTeachers(seededTeachers);
        setShowFirebaseData(true);
        await onRefresh();
        alert(`✅ Successfully seeded ${INITIAL_TEACHERS.length} teachers to empty database`);
      }
    } catch (error) {
      console.error("Error in smart seed:", error);
      alert("Failed to process seed request.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSendWarnings = async () => {
    if (!confirm("Send automated email reminders to all teachers who haven't submitted plans for next week?")) return;
    setIsSendingAlerts(true);
    try {
      alert("Automated email reminders are currently disabled.");
    } catch (e) {
      alert("Failed to trigger warnings.");
    } finally {
      setIsSendingAlerts(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditing(true);
    setShowEditPassword(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher || !editFormData) return;
    
    try {
      const updates = { ...editFormData };
      
      if (!updates.password || updates.password.trim() === '') {
        updates.password = DEFAULT_TEACHER_PASSWORD;
      }
      
      await onUpdateTeacher(editingTeacher.id, updates);
      setIsEditing(false);
      setEditingTeacher(null);
      setEditFormData({});
      await onRefresh();
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

  const handleAddNewTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert("Please enter both name and email.");
      return;
    }

    const teacherData: Teacher = {
      id: newTeacher.email.toLowerCase().trim(),
      name: newTeacher.name,
      email: newTeacher.email.toLowerCase().trim(),
      phone: newTeacher.phone || '',
      password: newTeacher.password || DEFAULT_TEACHER_PASSWORD,
      isClassTeacher: newTeacher.isClassTeacher || false,
      classTeacherOf: newTeacher.classTeacherOf || null,
      assignments: newTeacher.assignments || []
    };

    try {
      await onAddTeacher(teacherData);
      await onRefresh();
      setShowAddTeacher(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        password: DEFAULT_TEACHER_PASSWORD,
        isClassTeacher: false,
        classTeacherOf: null,
        assignments: []
      });
      alert("Teacher added successfully!");
    } catch (error) {
      alert("Failed to add teacher. Please try again.");
    }
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      {/* Edit Teacher Modal - Same as before */}
      {isEditing && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* ... existing edit modal code ... */}
        </div>
      )}

      {/* Add Teacher Modal - Same as before */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* ... existing add teacher modal code ... */}
        </div>
      )}

      {/* Firebase Data Preview Modal */}
      {showFirebaseData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                  <Server className="h-6 w-6 text-blue-600" />
                  Live Firebase Data
                </h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-1">
                  {firebaseTeachers.length} teachers in Firebase Cloud
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onRefresh}
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-200 flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-100">
                    <th className="pb-4 text-[10px] font-black uppercase text-blue-600 tracking-widest px-4">Faculty Member</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-blue-600 tracking-widest px-4">Assignments</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-blue-600 tracking-widest px-4">Status</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-blue-600 tracking-widest px-4">Password</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-blue-600 tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {firebaseTeachers.map(teacher => (
                    <tr key={teacher.id} className="group hover:bg-blue-50 transition-colors">
                      <td className="py-5 px-4">
                        <div className="font-black text-slate-900 italic">{teacher.name}</div>
                        <div className="text-[10px] text-slate-600 font-bold">{teacher.email}</div>
                        <div className="text-[8px] text-slate-400 font-bold">{teacher.phone}</div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignments.map((asgn, idx) => (
                            <span key={idx} className="text-[8px] font-black bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded uppercase">
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
                          <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">Faculty</span>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="text-[9px] font-bold text-slate-600 bg-blue-50 px-2 py-1 rounded">
                          {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setIsEditing(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors hover:bg-indigo-50"
                            title="Edit teacher"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Remove ${teacher.name} from database?`)) {
                                onRemoveTeacher(teacher.id).then(() => {
                                  setFirebaseTeachers(prev => prev.filter(t => t.id !== teacher.id));
                                  onRefresh();
                                });
                              }
                            }}
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

            <div className="mt-6 pt-6 border-t border-blue-100 flex justify-between items-center">
              <p className="text-[10px] text-blue-600">
                Live data from Firebase • Last fetched: {new Date().toLocaleTimeString()}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (firebaseTeachers.length === 0) {
                      handleSmartSeed();
                    } else {
                      alert(`Firebase already has ${firebaseTeachers.length} teachers. No seed needed.`);
                    }
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2"
                >
                  <CloudUpload className="h-4 w-4" />
                  Seed Only If Empty
                </button>
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section with New Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Faculty Registry</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            {teachers.length} teachers in database
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddTeacher(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
          >
            <Plus className="h-3 w-3" />
            Add Teacher
          </button>
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          
          {/* ✅ NEW BUTTON 1: View Firebase Data */}
          <button 
            onClick={handleViewFirebaseData}
            disabled={isLoadingFirebase}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isLoadingFirebase ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Server className="h-3 w-3" />
            )}
            {isLoadingFirebase ? 'Loading...' : 'View Firebase Data'}
          </button>
          
          {/* ✅ NEW BUTTON 2: Smart Seed (Seed only if empty) */}
          <button 
            onClick={handleSmartSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-violet-700 transition-all disabled:opacity-50"
          >
            {isSeeding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {isSeeding ? 'Processing...' : 'Smart Seed (If Empty)'}
          </button>
          
          <button 
            onClick={() => setShowSeedPreview(true)}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50"
          >
            <FileText className="h-3 w-3" />
            Preview Seed Data
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
            {isSeeding ? 'Seeding...' : 'Force Seed'}
          </button>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="space-y-6">
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="flex flex-col items-center">
              <Database className="h-16 w-16 text-blue-400 mb-4" />
              <p className="text-slate-800 font-black text-lg mb-2">📊 Database Status</p>
              <p className="text-slate-500 mb-6 max-w-md">
                Local state shows no teachers. Check Firebase for actual data or seed the database.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => setShowAddTeacher(true)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add Teacher
                </button>
                <button 
                  onClick={handleViewFirebaseData}
                  disabled={isLoadingFirebase}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingFirebase ? (
                    <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                  ) : (
                    <Server className="h-4 w-4 inline mr-2" />
                  )}
                  {isLoadingFirebase ? 'Loading...' : 'Check Firebase'}
                </button>
                <button 
                  onClick={handleSmartSeed}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50"
                >
                  {isSeeding ? (
                    <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 inline mr-2" />
                  )}
                  {isSeeding ? 'Processing...' : 'Smart Seed'}
                </button>
                <button 
                  onClick={() => setShowSeedPreview(true)}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50"
                >
                  <EyeIcon className="h-4 w-4 inline mr-2" />
                  Preview Seed Data
                </button>
                <button 
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4 inline mr-2" />
                  Force Seed
                </button>
              </div>
            </div>
          </div>

          {/* Seed Preview Section - Same as before */}
          {showSeedPreview && (
            <div className="border border-amber-200 bg-amber-50 rounded-3xl p-6">
              {/* ... existing seed preview code ... */}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Faculty Member</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Assignments</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Status</th>
                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Password</th>
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
                  <td className="py-5 px-4">
                    <div className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}
                    </div>
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
