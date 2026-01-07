// components/ResubmissionRequests.tsx
import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, 
  Mail, User, Calendar, BookOpen, ChevronRight,
  RefreshCw, MessageSquare, Award
} from 'lucide-react';

interface ResubmissionRequestsProps {
  requests: any[];
  onApprove: (requestId: string) => Promise<void>;
  onDecline: (requestId: string, reason?: string) => Promise<void>;
}

const ResubmissionRequests: React.FC<ResubmissionRequestsProps> = ({
  requests,
  onApprove,
  onDecline
}) => {
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approve this resubmission request? This will delete the existing submission and allow the teacher to resubmit.')) return;
    
    setIsProcessing(requestId);
    try {
      await onApprove(requestId);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!selectedRequest || requestId !== selectedRequest) {
      setSelectedRequest(requestId);
      return;
    }

    const reason = declineReason.trim() || undefined;
    if (!confirm('Decline this resubmission request? The teacher will be notified.')) return;
    
    setIsProcessing(requestId);
    try {
      await onDecline(requestId, reason);
      setSelectedRequest(null);
      setDeclineReason('');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeek = (dateString: string) => {
    const date = new Date(dateString);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} - ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Resubmission Requests
          </h3>
          <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
            Pending approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-black text-gray-400 bg-gray-900/50 px-4 py-2 rounded-xl">
            {requests.length} Pending
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
          <CheckCircle2 className="h-16 w-16 text-emerald-400/30 mx-auto mb-6" />
          <p className="text-gray-400 font-bold text-lg mb-2">All clear!</p>
          <p className="text-gray-500 text-sm">No pending resubmission requests</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-6 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-black text-white">{request.teacher_name}</span>
                      <span className="text-xs font-black bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {request.teacher_email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Week: {formatWeek(request.week_starting)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={isProcessing === request.id}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing === request.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  
                  {selectedRequest === request.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reason for decline (optional)"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 min-w-[200px]"
                        onKeyPress={(e) => e.key === 'Enter' && handleDecline(request.id)}
                      />
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={isProcessing === request.id}
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:from-rose-500 hover:to-pink-500 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isProcessing === request.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setDeclineReason('');
                        }}
                        className="px-4 py-2.5 bg-gray-700 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={isProcessing === request.id}
                      className="px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  )}
                </div>
              </div>

              {/* Class Sections */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-300">Requested Classes:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {request.class_sections?.map((cs: any, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="text-sm font-black text-white">
                        {cs.className}-{cs.section}
                      </div>
                      <div className="text-xs text-gray-400">{cs.subject}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700/50">
                <div className="p-3 bg-gray-900/30 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Request ID</div>
                  <div className="text-sm font-bold text-white font-mono">{request.id}</div>
                </div>
                <div className="p-3 bg-gray-900/30 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Submission Week</div>
                  <div className="text-sm font-bold text-white">
                    {new Date(request.week_starting).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
                <div className="p-3 bg-gray-900/30 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Time Elapsed</div>
                  <div className="text-sm font-bold text-white">
                    {Math.floor((Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResubmissionRequests;
