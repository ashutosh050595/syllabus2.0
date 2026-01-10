import React, { useState, useEffect } from 'react';
import { 
  Printer, Download, Mail, FileText, Calendar, 
  Users, CheckCircle2, AlertCircle, RefreshCw,
  Filter, Search, Eye, Send, Clock, Database,
  ChevronDown, ChevronUp, X, Loader2, Shield,
  BookOpen, User, BarChart, PieChart, TrendingUp
} from 'lucide-react';
import { PDFGenerator } from '../services/pdf-generator';
import { EmailService } from '../services/email-service';

interface AdminCompilerProps {
  lessonPlans: any[];
  teachers: any[];
}

const AdminCompiler: React.FC<AdminCompilerProps> = ({ lessonPlans, teachers }) => {
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<any[]>([]);
  const [missingTeachers, setMissingTeachers] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Extract unique weeks from lesson plans
  const weeks = [...new Set(lessonPlans.map(plan => plan.weekRange))].sort();
  
  // Extract unique classes
  const classes = [...new Set(lessonPlans.map(plan => plan.className))].sort();
  
  // Get sections for selected class
  const sections = selectedClass 
    ? [...new Set(lessonPlans
        .filter(plan => plan.className === selectedClass)
        .map(plan => plan.section)
      )].sort()
    : [];

  // Get class teachers
  const classTeachers = teachers.filter(t => t.isClassTeacher);

  // Get current date for default week selection
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(weeks[0]);
    }
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [weeks, classes]);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections]);

  const handleGeneratePDF = () => {
    if (!selectedWeek || !selectedClass || !selectedSection) {
      alert('Please select week, class, and section');
      return;
    }

    // Find class teacher for this class
    const classTeacher = classTeachers.find(t => 
      t.classTeacherOf?.className === selectedClass && 
      t.classTeacherOf?.section === selectedSection
    );

    if (!classTeacher) {
      alert(`No class teacher found for ${selectedClass}-${selectedSection}`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get lesson plans for this class, section, and week
      const classLessonPlans = lessonPlans.filter(plan => 
        plan.className === selectedClass && 
        plan.section === selectedSection && 
        plan.weekRange === selectedWeek
      );

      // Get all teachers assigned to this class
      const assignedTeachers = teachers.filter(teacher => 
        teacher.assignments?.some((assignment: any) => 
          assignment.className === selectedClass && 
          assignment.sections?.includes(selectedSection)
        )
      );

      // Find missing teachers
      const submittedTeacherIds = classLessonPlans.map(plan => plan.teacherId);
      const missing = assignedTeachers
        .filter(teacher => !submittedTeacherIds.includes(teacher.email))
        .map(teacher => teacher.name);

      setMissingTeachers(missing);

      // Generate PDF
      const pdfBase64 = PDFGenerator.generatePDFFromLessonPlans(
        selectedClass,
        selectedSection,
        selectedWeek,
        classTeacher.name,
        lessonPlans,
        teachers
      );

      const newPDF = {
        id: Date.now(),
        className: selectedClass,
        section: selectedSection,
        weekRange: selectedWeek,
        pdfBase64,
        timestamp: new Date(),
        missingTeachers: missing,
        classTeacher: classTeacher.name,
        classTeacherEmail: classTeacher.email
      };

      setGeneratedPDFs(prev => [newPDF, ...prev]);
      addLog(`Generated PDF for ${selectedClass}-${selectedSection} (${selectedWeek})`, 'success');
      
      alert(`✅ PDF generated successfully!\n\nMissing teachers: ${missing.length > 0 ? missing.join(', ') : 'None'}`);
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      addLog(`Failed to generate PDF: ${error.message}`, 'error');
      alert('❌ Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendPDF = async (pdf: any) => {
    if (!confirm(`Send PDF to ${pdf.classTeacher} (${pdf.classTeacherEmail})?`)) return;
    
    setIsSending(true);
    
    try {
      const emailSent = await EmailService.sendEmail(
        EmailService.createWeeklyPDFAutoSend(
          pdf.classTeacher,
          pdf.classTeacherEmail,
          pdf.weekRange,
          pdf.className,
          pdf.section,
          pdf.pdfBase64
        )
      );
      
      if (emailSent) {
        addLog(`Sent PDF to ${pdf.classTeacher} (${pdf.classTeacherEmail})`, 'success');
        alert('✅ PDF sent successfully!');
      } else {
        addLog(`Failed to send PDF to ${pdf.classTeacher}`, 'error');
        alert('❌ Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending PDF:', error);
      addLog(`Error sending PDF: ${error.message}`, 'error');
      alert('❌ Error sending PDF: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviewPDF = (pdf: any) => {
    setPreviewData(pdf);
    setShowPreview(true);
  };

  const handleAutoSendAll = async () => {
    if (!selectedWeek) {
      alert('Please select a week first');
      return;
    }

    if (!confirm(`Send PDFs to ALL class teachers for week ${selectedWeek}?\n\nThis will generate and email PDFs for all classes.`)) return;
    
    setIsSending(true);
    
    try {
      const results = await PDFGenerator.generatePDFsForAllClasses(selectedWeek, teachers, lessonPlans);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const result of results) {
        try {
          const emailSent = await EmailService.sendEmail(
            EmailService.createWeeklyPDFAutoSend(
              result.teacherName,
              result.teacherEmail,
              selectedWeek,
              result.className,
              result.section,
              result.pdfBase64
            )
          );
          
          if (emailSent) {
            successCount++;
            addLog(`Sent to ${result.teacherName} (${result.className}-${result.section})`, 'success');
          } else {
            errorCount++;
            addLog(`Failed to send to ${result.teacherName}`, 'error');
          }
        } catch (error) {
          errorCount++;
          addLog(`Error sending to ${result.teacherName}: ${error}`, 'error');
        }
      }
      
      alert(`📨 Auto-send completed!\n\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`);
      
    } catch (error: any) {
      console.error('Error in auto-send:', error);
      alert('❌ Auto-send failed: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const addLog = (message: string, type: 'success' | 'error' | 'info') => {
    const newLog = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  const getClassTeacherForClass = (className: string, section: string) => {
    return classTeachers.find(t => 
      t.classTeacherOf?.className === className && 
      t.classTeacherOf?.section === section
    );
  };

  const getSubmittedCount = (className: string, section: string, week: string) => {
    return lessonPlans.filter(plan => 
      plan.className === className && 
      plan.section === section && 
      plan.weekRange === week
    ).length;
  };

  const getTotalTeachersForClass = (className: string, section: string) => {
    return teachers.filter(teacher => 
      teacher.assignments?.some((assignment: any) => 
        assignment.className === className && 
        assignment.sections?.includes(section)
      )
    ).length;
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tight">PDF Compilation</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Generate weekly syllabus PDFs
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAutoSendAll}
            disabled={isSending || !selectedWeek}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Auto Send All Classes
          </button>
          <button 
            onClick={() => setLogs([])}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-2" />
            Select Week
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
          >
            <option value="">Select a week</option>
            {weeks.map(week => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <BookOpen className="h-4 w-4 inline mr-2" />
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
          >
            <option value="">Select a class</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Users className="h-4 w-4 inline mr-2" />
            Select Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            disabled={!selectedClass}
          >
            <option value="">Select a section</option>
            {sections.map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating || !selectedWeek || !selectedClass || !selectedSection}
          className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            isGenerating || !selectedWeek || !selectedClass || !selectedSection
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Printer className="h-6 w-6" />
              Generate PDF for {selectedClass}-{selectedSection}
            </>
          )}
        </button>
        
        {selectedWeek && selectedClass && selectedSection && (
          <div className="mt-4 text-center text-sm text-slate-500">
            <div className="flex justify-center items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>Total Teachers: {getTotalTeachersForClass(selectedClass, selectedSection)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Submitted: {getSubmittedCount(selectedClass, selectedSection, selectedWeek)}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Missing: {getTotalTeachersForClass(selectedClass, selectedSection) - getSubmittedCount(selectedClass, selectedSection, selectedWeek)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated PDFs List */}
      {generatedPDFs.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Generated PDFs ({generatedPDFs.length})
          </h4>
          
          <div className="space-y-4">
            {generatedPDFs.map(pdf => {
              const classTeacher = getClassTeacherForClass(pdf.className, pdf.section);
              
              return (
                <div key={pdf.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-300 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg">
                            {pdf.className}-{pdf.section} - {pdf.weekRange}
                          </div>
                          <div className="text-sm text-slate-500">
                            Class Teacher: {classTeacher?.name || 'Not assigned'}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded">
                              📅 {new Date(pdf.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded">
                              🕒 {new Date(pdf.timestamp).toLocaleTimeString()}
                            </span>
                            {pdf.missingTeachers.length > 0 && (
                              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                ⚠️ {pdf.missingTeachers.length} missing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewPDF(pdf)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 flex items-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          // Download PDF
                          const link = document.createElement('a');
                          link.href = `data:application/pdf;base64,${pdf.pdfBase64}`;
                          link.download = `${pdf.className}_${pdf.section}_${pdf.weekRange.replace(/ /g, '_')}.pdf`;
                          link.click();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                      <button
                        onClick={() => handleSendPDF(pdf)}
                        disabled={isSending || !classTeacher}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Mail className="h-3 w-3" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">PDF Preview</h3>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                  {previewData.className}-{previewData.section} - {previewData.weekRange}
                </p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-rose-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8">
              <div className="text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-700 mb-2">PDF Preview Unavailable</h4>
                <p className="text-slate-500 mb-6">
                  PDF preview requires additional setup. Click "Download" to view the actual PDF file.
                </p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:application/pdf;base64,${previewData.pdfBase64}`;
                      link.download = `${previewData.className}_${previewData.section}_${previewData.weekRange.replace(/ /g, '_')}.pdf`;
                      link.click();
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>

            {previewData.missingTeachers.length > 0 && (
              <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Missing Lesson Plans
                </h4>
                <div className="space-y-2">
                  {previewData.missingTeachers.map((teacher: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-amber-100 rounded-lg">
                      <User className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-800">{teacher}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-amber-600 mt-3">
                  These teachers have not submitted lesson plans for this week.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div className="p-5 bg-slate-50 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            Activity Logs
          </h4>
          <span className="text-xs text-slate-500">{logs.length} entries</span>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No activity yet</p>
            <p className="text-slate-300 text-sm">Generate PDFs to see logs here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className={`p-3 rounded-xl border ${
                log.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                log.type === 'error' ? 'bg-rose-50 border-rose-100' :
                'bg-slate-100 border-slate-200'
              }`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div className="flex items-center gap-3">
                    {log.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : log.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${
                      log.type === 'success' ? 'text-emerald-700' :
                      log.type === 'error' ? 'text-rose-700' :
                      'text-slate-600'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 md:ml-4">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-black text-blue-800 mb-2">How PDF Generation Works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• PDFs are generated in <strong>exact Sacred Heart School format</strong></li>
              <li>• Files are named as: <code>Class_Section_DateRange.pdf</code></li>
              <li>• Missing teachers are shown as "Lesson Plan Not Submitted"</li>
              <li>• Use "Auto Send All Classes" to send PDFs to all class teachers</li>
              <li>• PDFs are attached to emails and can also be downloaded</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCompiler;
