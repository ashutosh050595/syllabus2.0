import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Send, X, CheckCircle2, FileText, Shield } from 'lucide-react';
import { APIService } from '../services/api-supabase';
import { EmailService } from '../services/email-service';

interface ModificationRequestProps {
  teacher: any;
  weekRange: string;
  submissions: any[];
  onRequestSubmitted: () => void;
  onClose: () => void;
}

const TeacherModificationRequest: React.FC<ModificationRequestProps> = ({
  teacher,
  weekRange,
  submissions,
  onRequestSubmitted,
  onClose
}) => {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [requestId, setRequestId] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Get unique classes from submissions for this week
  const submittedClasses = submissions
    .filter(s => s.weekRange === weekRange)
    .map(s => {
      const className = s.className || s.class || '';
      const section = s.section || '';
      return `${className}${section ? `-${section}` : ''}`;
    })
    .filter((value, index, self) => self.indexOf(value) === index);

  useEffect(() => {
    checkPendingRequests();
  }, [teacher.email, weekRange]);

  const checkPendingRequests = async () => {
    try {
      const requests = await APIService.getResubmissionRequests(teacher.email, weekRange);
      const pending = requests.find(req => req.status === 'pending');
      const approved = requests.find(req => req.status === 'approved');
      const rejected = requests.find(req => req.status === 'rejected');
      
      if (pending) {
        setHasPendingRequest(true);
        setRequestId(pending.id);
        setRequestStatus('pending');
      } else if (approved) {
        setHasPendingRequest(true);
        setRequestId(approved.id);
        setRequestStatus('approved');
      } else if (rejected) {
        setHasPendingRequest(true);
        setRequestId(rejected.id);
        setRequestStatus('rejected');
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === submittedClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses([...submittedClasses]);
    }
  };

  const handleSubmitRequest = async () => {
    if (selectedClasses.length === 0) {
      alert('❌ Please select at least one class to modify');
      return;
    }

    if (!confirm(`📤 Request modification for ${selectedClasses.length} class(es) for week ${weekRange}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare classes data
      const classesData = selectedClasses.map(cls => {
        const [className, section] = cls.split('-');
        const submission = submissions.find(s => {
          const subClassName = s.className || s.class || '';
          const subSection = s.section || '';
          return `${subClassName}${subSection ? `-${subSection}` : ''}` === cls;
        });
        
        return {
          className: className,
          section: section || '',
          subject: submission?.subject || 'Unknown'
        };
      });

      // Create request in database
      const request = await APIService.createResubmissionRequest({
        teacher_id: teacher.email,
        teacher_name: teacher.name,
        teacher_email: teacher.email,
        week_range: weekRange,
        classes: classesData,
        status: 'pending'
      });

      // Send email to teacher
      const teacherEmailSent = await EmailService.sendEmail(
        EmailService.createResubmissionRequestTeacher(
          teacher.name,
          teacher.email,
          weekRange,
          selectedClasses
        )
      );

      // Send email to admin
      const adminEmailSent = await EmailService.sendEmail(
        EmailService.createResubmissionRequestAdmin(
          teacher.name,
          teacher.email,
          weekRange,
          selectedClasses,
          request.id
        )
      );

      if (teacherEmailSent && adminEmailSent) {
        setHasPendingRequest(true);
        setRequestId(request.id);
        setRequestStatus('pending');
        onRequestSubmitted();
        alert('✅ Modification request submitted successfully!\n\n📧 Email sent to admin for approval.\n⏳ Wait for admin approval before resubmitting.');
      } else {
        alert('⚠️ Request submitted but email notifications failed.\n\nAdmin will still see your request in the dashboard.');
      }
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert('❌ Failed to submit request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPendingRequest) {
    const getStatusMessage = () => {
      switch (requestStatus) {
        case 'pending':
          return {
            title: '⏳ Request Pending Approval',
            message: 'Your modification request is waiting for admin approval. You will receive an email when approved.',
            color: 'amber',
            icon: <AlertCircle className="h-6 w-6 text-amber-600" />
          };
        case 'approved':
          return {
            title: '✅ Request Approved',
            message: 'Your request has been approved! You can now resubmit your lesson plan.',
            color: 'emerald',
            icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          };
        case 'rejected':
          return {
            title: '❌ Request Rejected',
            message: 'Your modification request has been rejected by admin. You cannot resubmit for this week.',
            color: 'rose',
            icon: <X className="h-6 w-6 text-rose-600" />
          };
        default:
          return {
            title: '📋 Request Status',
            message: 'Your request is being processed.',
            color: 'blue',
            icon: <FileText className="h-6 w-6 text-blue-600" />
          };
      }
    };

    const status = getStatusMessage();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-[2.5rem] p-8 max-w-md w-full border-2 border-${status.color}-100`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-${status.color}-100 rounded-xl`}>
                {status.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">{status.title}</h3>
                <p className="text-slate-500 text-sm">Week: {weekRange}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className={`p-4 bg-${status.color}-50 border border-${status.color}-200 rounded-xl mb-6`}>
            <div className="flex items-center gap-3">
              <Shield className={`h-5 w-5 text-${status.color}-600`} />
              <div>
                <p className={`text-${status.color}-800 font-bold`}>{status.title.split(' ')[1]}</p>
                <p className={`text-${status.color}-600 text-sm mt-1`}>
                  {status.message}
                </p>
                <p className={`text-xs text-${status.color}-500 mt-2`}>
                  Request ID: {requestId}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-bold">Classes requested:</p>
            <div className="flex flex-wrap gap-2">
              {submittedClasses.map(cls => (
                <span key={cls} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                  {cls}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight">Request Modification</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
              Week: {weekRange}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-bold">Important Information</p>
              <ul className="text-blue-600 text-sm space-y-1 mt-2">
                <li>• You can request modification only <strong>once per week</strong></li>
                <li>• Admin must approve before you can resubmit</li>
                <li>• Original submission will be deleted if approved</li>
                <li>• Select all classes you want to modify</li>
                <li>• Admin will review and email you the decision</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900">Select Classes to Modify</h4>
            <button
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
            >
              {selectedClasses.length === submittedClasses.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          {submittedClasses.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">No submissions found for {weekRange}</p>
              <p className="text-slate-300 text-sm mt-1">Submit a lesson plan first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submittedClasses.map(cls => {
                const submission = submissions.find(s => {
                  const className = s.className || s.class || '';
                  const section = s.section || '';
                  return `${className}${section ? `-${section}` : ''}` === cls;
                });
                
                return (
                  <label
                    key={cls}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedClasses.includes(cls)
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls)}
                      onChange={() => handleClassToggle(cls)}
                      className="h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{cls}</div>
                      {submission?.subject && (
                        <div className="text-sm text-slate-500">Subject: {submission.subject}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        Submitted: {new Date(submission?.submittedAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${selectedClasses.includes(cls) ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white pt-6 border-t border-slate-100">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting || selectedClasses.length === 0}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Modification Request ({selectedClasses.length} classes)
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-4">
            📧 This will send email notifications to admin@sacredheartkoderma.org
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherModificationRequest;
