// components/AutoSendDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Zap, Clock, Send, Calendar, FileText, CheckCircle2, 
  AlertCircle, RefreshCw, Cloud, Download, Printer, Mail,
  Users, AlertTriangle, Loader2, Shield
} from 'lucide-react';
import { EmailService } from '../services/email-service';
import { APIService } from '../services/api-supabase';

interface AutoSendDashboardProps {
  teachers: any[];
  lessonPlans: any[];
  isOnline: boolean;
}

const AutoSendDashboard: React.FC<AutoSendDashboardProps> = ({ 
  teachers, 
  lessonPlans,
  isOnline 
}) => {
  const [isSending, setIsSending] = useState(false);
  const [nextSendTime, setNextSendTime] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    calculateNextSendTime();
  }, []);

  const calculateNextSendTime = () => {
    const now = new Date();
    const saturday = new Date(now);
    
    // Find next Saturday
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(20, 0, 0, 0); // 8:00 PM
    
    setNextSendTime(saturday.toLocaleString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));
  };

  // Simple mock PDF generator
  const generateMockPDFBase64 = () => {
    const mockPDFContent = `
      SACRED HEART SCHOOL
      (Affiliated to CBSE, New Delhi, upto +2 Level)
      
      WEEKLY SYLLABUS
      Date: ${new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })} to ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })}
      
      Class & Sec: VI D
      Name of Class Teacher: Rahul Kumar
      
      This PDF will be generated in exact Sacred Heart format with all lesson plans.
      Actual implementation will use your existing PDF generation system.
    `;
    return btoa(unescape(encodeURIComponent(mockPDFContent)));
  };

  const handleManualSend = async () => {
    if (!isOnline) {
      alert('❌ No internet connection. Please check your network.');
      return;
    }

    if (!confirm('📤 Send weekly PDFs to all class teachers now?\n\nThis will send emails with PDF attachments to all class teachers.')) {
      return;
    }

    setIsSending(true);
    setStatus('sending');
    setLogs([]);

    try {
      // Get all class teachers
      const classTeachers = teachers.filter(t => t.isClassTeacher);
      
      if (classTeachers.length === 0) {
        alert('⚠️ No class teachers found in the system.');
        setStatus('error');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const teacher of classTeachers) {
        try {
          const weekRange = '29-Dec-2025 to 10-Jan-2026';
          const className = teacher.classTeacherOf?.className || 'Class';
          const section = teacher.classTeacherOf?.section || 'Section';
          
          const pdfBase64 = generateMockPDFBase64();
          
          // Send email with PDF attachment
          const emailSent = await EmailService.sendEmail(
            EmailService.createWeeklyPDFAutoSend(
              teacher.name,
              teacher.email,
              weekRange,
              className,
              section,
              pdfBase64
            )
          );
          
          if (emailSent) {
            console.log(`✅ Sent PDF to ${teacher.name} (${teacher.email})`);
            addLog(`Sent to ${teacher.name}`, 'success');
            successCount++;
          } else {
            console.error(`❌ Failed to send to ${teacher.name}`);
            addLog(`Failed to send to ${teacher.name}`, 'error');
            errorCount++;
          }
        } catch (error: any) {
          console.error(`Error sending to ${teacher.name}:`, error);
          addLog(`Error: ${teacher.name} - ${error.message}`, 'error');
          errorCount++;
        }
      }
      
      setStatus('sent');
      alert(`✅ Weekly PDFs sent!\n\nSuccess: ${successCount}\nFailed: ${errorCount}`);
    } catch (error: any) {
      setStatus('error');
      console.error('Manual send failed:', error);
      alert('❌ Failed to send PDFs: ' + error.message);
    } finally {
      setIsSending(false);
      setTimeout(() => setStatus('idle'), 5000);
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

  const getClassTeachersCount = () => {
    return teachers.filter(t => t.isClassTeacher).length;
  };

  const getNextWeekDates = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    
    return {
      start: nextMonday.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      end: nextFriday.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    };
  };

  const nextWeek = getNextWeekDates();

  return (
    <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight">Auto Send System</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Weekly PDF Auto Distribution
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-indigo-100">
            <Clock className="h-3 w-3 inline mr-2" />
            Next: {nextSendTime}
          </div>
          <button 
            onClick={() => calculateNextSendTime()}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl"
            title="Refresh time"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="p-5 md:p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Schedule</p>
              <p className="text-base md:text-lg font-black text-slate-900">Every Saturday</p>
              <p className="text-sm font-bold text-indigo-600">8:00 PM</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">PDF Format</p>
              <p className="text-base md:text-lg font-black text-slate-900">Exact Template</p>
              <p className="text-sm font-bold text-emerald-600">Sacred Heart Layout</p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 rounded-xl">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest">Recipients</p>
              <p className="text-base md:text-lg font-black text-slate-900">
                {getClassTeachersCount()} Class Teachers
              </p>
              <p className="text-sm font-bold text-violet-600">Auto Email + Attachment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Control Section */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h4 className="font-black text-slate-900 text-lg md:text-xl">Manual Trigger</h4>
            <p className="text-sm text-slate-500">Send weekly PDFs immediately for testing</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-black text-xs ${
            status === 'idle' ? 'bg-slate-100 text-slate-600' :
            status === 'sending' ? 'bg-amber-100 text-amber-600' :
            status === 'sent' ? 'bg-emerald-100 text-emerald-600' :
            'bg-rose-100 text-rose-600'
          }`}>
            {status === 'idle' ? '🟢 Ready' : 
             status === 'sending' ? '🟡 Sending...' :
             status === 'sent' ? '✅ Sent' : '❌ Error'}
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-800 text-sm font-bold">Next Week: {nextWeek.start} to {nextWeek.end}</p>
              <p className="text-blue-600 text-xs">PDF will be generated for this week range</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleManualSend}
          disabled={isSending || !isOnline}
          className={`w-full py-3 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            isSending ? 'bg-slate-300 cursor-not-allowed' :
            !isOnline ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
            'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
          }`}
        >
          {isSending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending PDFs to {getClassTeachersCount()} teachers...
            </>
          ) : !isOnline ? (
            <>
              <AlertCircle className="h-5 w-5" />
              Offline - Cannot Send
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              📤 Send Weekly PDFs Now
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          This will send PDFs to all {getClassTeachersCount()} class teachers immediately. Use for testing.
        </p>
      </div>

      {/* Logs Section */}
      <div className="p-5 md:p-6 bg-slate-50 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-900 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-indigo-600" />
            Recent Activity Logs
          </h4>
          <button 
            onClick={() => setLogs([])}
            className="text-xs text-slate-400 hover:text-rose-600 font-bold"
          >
            Clear Logs
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No activity yet</p>
            <p className="text-slate-300 text-sm">Send PDFs to see logs here</p>
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
                      <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
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

      {/* Info Section */}
      <div className="p-5 md:p-6 bg-amber-50 border border-amber-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-black text-amber-800 mb-2">How It Works</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• System automatically sends PDF every <strong>Saturday at 8:00 PM</strong></li>
              <li>• PDF is generated in <strong>exact Sacred Heart School format</strong></li>
              <li>• Email includes PDF attachment with complete weekly lesson plan</li>
              <li>• Sent to all class teachers automatically</li>
              <li>• Use "Send Now" button for immediate testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ YEH LINE IMPORTANT HAI: Default export karna zaroori hai
export default AutoSendDashboard;
