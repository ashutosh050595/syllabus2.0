import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle2, XCircle, AlertCircle, 
  Mail, User, Calendar, BookOpen, X, Clock,
  FileText, Shield, Eye, Trash2, Filter,
  ChevronDown, ChevronUp, Search, Download, Send,
  Database, Server, Wifi, WifiOff, Loader2, ThumbsUp,
  ThumbsDown, AlertTriangle, Bell, MessageSquare
} from 'lucide-react';
import { APIService } from '../services/api-supabase';
import { EmailService } from '../services/email-service';

interface AdminResubmissionRequestsProps {
  onRefresh?: () => void;
  isOnline?: boolean;
}

const AdminResubmissionRequests: React.FC<AdminResubmissionRequestsProps> = ({ 
  onRefresh,
  isOnline = true 
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestToReject, setRequestToReject] = useState<any>(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    if (!isOnline) {
      alert('📡 No internet connection. Please check your network.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await APIService.getAllResubmissionRequests();
      let filteredData = data;
      
      if (filter !== 'all') {
        filteredData = data.filter(r => r.status === filter);
      }
      
      if (search) {
        filteredData = filteredData.filter(r => 
          r.teacher_name.toLowerCase().includes(search.toLowerCase()) ||
          r.teacher_email.toLowerCase().includes(search.toLowerCase()) ||
          r.week_range.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setRequests(filteredData);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      setRequests([]);
      alert(`❌ Failed to load requests: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    if (!isOnline) {
      alert('📡 No internet connection. Cannot approve request.');
      return;
    }

    if (!confirm(`✅ Approve resubmission request for ${request.teacher_name}?\n\n📝 This will:\n• Delete their original submission\n• Allow them to resubmit\n• Send approval email to teacher`)) return;
    
    setProcessingId(request.id);
    try {
      // Update request status
      await APIService.updateResubmissionRequest(request.id, { 
        status: 'approved',
        updated_at: new Date().toISOString()
      });

      // Delete original submissions
      await APIService.deleteTeacherSubmissions(
        request.teacher_id,
        request.week_range,
        request.classes
      );

      // Send approval email
      const emailSent = await EmailService.sendEmail(
        EmailService.createResubmissionApproval(
          request.teacher_name,
          request.teacher_email,
          request.week_range,
          request.classes.map((c: any) => `${c.className}${c.section ? `-${c.section}` : ''}`)
        )
      );

      // Refresh data
      await loadRequests();
      onRefresh?.();
      
      if (emailSent) {
        alert(`✅ Request approved!\n\n📧 ${request.teacher_name} has been notified and can now resubmit.\n🗑️ Original submission deleted.`);
      } else {
        alert(`⚠️ Request approved but email notification failed.\n\n${request.teacher_name} can resubmit but may not be notified.`);
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(`❌ Failed to approve request: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithReason = async () => {
    if (!requestToReject) return;
    
    if (!rejectionReason.trim()) {
      alert('⚠️ Please enter a reason for rejection.');
      return;
    }

    if (!isOnline) {
      alert('📡 No internet connection. Cannot reject request.');
      return;
    }

    setProcessingId(requestToReject.id);
    try {
      await APIService.updateResubmissionRequest(requestToReject.id, { 
        status: 'rejected',
        reason: rejectionReason,
        updated_at: new Date().toISOString()
      });

      const emailSent = await EmailService.sendEmail(
        EmailService.createResubmissionRejection(
          requestToReject.teacher_name,
          requestToReject.teacher_email,
          requestToReject.week_range,
          requestToReject.classes.map((c: any) => `${c.className}${c.section ? `-${c.section}` : ''}`),
          rejectionReason
        )
      );

      await loadRequests();
      
      if (emailSent) {
        alert(`✅ Request rejected!\n\n📧 ${requestToReject.teacher_name} has been notified with your reason.`);
      } else {
        alert('⚠️ Request rejected but email notification failed.');
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(`❌ Failed to reject request: ${error.message}`);
    } finally {
      setProcessingId(null);
      setShowReasonDialog(false);
      setRejectionReason('');
      setRequestToReject(null);
    }
  };

  const promptReject = (request: any) => {
    setRequestToReject(request);
    setShowReasonDialog(true);
    setRejectionReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: <AlertCircle className="h-4 w-4" /> };
      case 'approved': return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> };
      case 'rejected': return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', icon: <XCircle className="h-4 w-4" /> };
      default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', icon: <AlertCircle className="h-4 w-4" /> };
    }
  };

  const getStatusCount = (status: string) => {
    return requests.filter(r => r.status === status).length;
  };

  if (!isOnline) {
    return (
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="text-center py-16">
          <WifiOff className="h-16 w-16 text-rose-400 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-800 mb-3">Offline Mode</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            You need an internet connection to manage resubmission requests.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-rose-600">No Internet Connection</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tight">Resubmission Requests</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Manage teacher modification requests
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={loadRequests}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Pending</p>
              <p className="text-2xl font-black text-amber-800">{getStatusCount('pending')}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Approved</p>
              <p className="text-2xl font-black text-emerald-800">{getStatusCount('approved')}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div className="p-5 bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Rejected</p>
              <p className="text-2xl font-black text-rose-800">{getStatusCount('rejected')}</p>
            </div>
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
        </div>
        <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Total</p>
              <p className="text-2xl font-black text-slate-800">{requests.length}</p>
            </div>
            <Database className="h-8 w-8 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by teacher name, email, or week..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setTimeout(() => loadRequests(), 300);
              }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                filter === status
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 text-slate-300 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-bold">Loading resubmission requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold text-lg">No {filter === 'all' ? '' : filter} requests found</p>
          <p className="text-slate-300 text-sm">All requests are processed or none exist</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map(request => {
            const statusColor = getStatusColor(request.status);
            return (
              <div key={request.id} className={`p-6 bg-gradient-to-r from-slate-50 to-white border ${statusColor.border} rounded-2xl hover:border-indigo-200 transition-colors`}>
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left Section - Teacher Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="font-black text-slate-900 text-lg">{request.teacher_name}</h4>
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase border flex items-center gap-1 ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            {statusColor.icon}
                            {request.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{request.teacher_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="font-bold text-indigo-600">{request.week_range}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-500 text-xs">
                              {new Date(request.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Classes Section */}
                    <div className="ml-16">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-700">Classes for Modification:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.classes.map((cls: any, idx: number) => (
                          <span key={idx} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2">
                            <span className="text-indigo-600">{cls.className}</span>
                            {cls.section && <span className="text-slate-500">({cls.section})</span>}
                            {cls.subject && <span className="text-slate-400">- {cls.subject}</span>}
                          </span>
                        ))}
                      </div>
                      
                      {request.reason && request.status === 'rejected' && (
                        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                            <span className="font-bold text-rose-800">Rejection Reason:</span>
                          </div>
                          <p className="text-rose-700 text-sm">{request.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="lg:w-64 flex flex-col gap-3">
                    {request.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve Request
                        </button>
                        <button
                          onClick={() => promptReject(request)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Reject Request
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className={`p-3 rounded-xl mb-3 ${statusColor.bg} ${statusColor.border}`}>
                          <div className="flex items-center justify-center gap-2">
                            {statusColor.icon}
                            <span className="font-bold">Request {request.status}</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Updated: {new Date(request.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Request Details</h3>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
                  ID: {selectedRequest.id}
                </p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 text-slate-400 hover:text-rose-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  Teacher Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Name</div>
                    <div className="font-bold text-slate-900">{selectedRequest.teacher_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Email</div>
                    <div className="font-medium text-slate-700">{selectedRequest.teacher_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Teacher ID</div>
                    <div className="font-medium text-slate-700">{selectedRequest.teacher_id}</div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Request Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Week Range</div>
                    <div className="font-bold text-indigo-600">{selectedRequest.week_range}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Status</div>
                    <div className={`px-3 py-1 rounded-lg inline-flex items-center gap-2 ${getStatusColor(selectedRequest.status).bg} ${getStatusColor(selectedRequest.status).text} ${getStatusColor(selectedRequest.status).border}`}>
                      {getStatusColor(selectedRequest.status).icon}
                      <span className="font-bold">{selectedRequest.status}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Submitted</div>
                    <div className="font-medium text-slate-700">
                      {new Date(selectedRequest.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  {selectedRequest.reason && (
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Rejection Reason</div>
                      <div className="font-medium text-rose-700 bg-rose-50 p-2 rounded">{selectedRequest.reason}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 bg-indigo-50 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Classes for Modification ({selectedRequest.classes.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-indigo-100">
                      <th className="pb-3 text-left text-xs font-black uppercase text-indigo-600">Class</th>
                      <th className="pb-3 text-left text-xs font-black uppercase text-indigo-600">Section</th>
                      <th className="pb-3 text-left text-xs font-black uppercase text-indigo-600">Subject</th>
                      <th className="pb-3 text-left text-xs font-black uppercase text-indigo-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.classes.map((cls: any, idx: number) => (
                      <tr key={idx} className="border-b border-indigo-50 last:border-0 hover:bg-indigo-100/50">
                        <td className="py-3 font-bold text-slate-900">{cls.className}</td>
                        <td className="py-3 text-slate-600">{cls.section || 'N/A'}</td>
                        <td className="py-3 text-slate-600">{cls.subject || 'Not specified'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            selectedRequest.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            selectedRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {selectedRequest.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={processingId === selectedRequest.id}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {processingId === selectedRequest.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      promptReject(selectedRequest);
                    }}
                    disabled={processingId === selectedRequest.id}
                    className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 disabled:opacity-50 transition-all"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {showReasonDialog && requestToReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Rejection Reason</h3>
                <p className="text-slate-500 text-sm">For: {requestToReject.teacher_name}</p>
              </div>
              <button onClick={() => setShowReasonDialog(false)} className="p-2 text-slate-400 hover:text-rose-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Why are you rejecting this request?
              </label>
              <textarea
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 resize-none"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-2">
                This reason will be sent to the teacher via email.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReasonDialog(false);
                  setRequestToReject(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithReason}
                disabled={!rejectionReason.trim() || processingId === requestToReject.id}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {processingId === requestToReject.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="text-sm text-slate-500">
            <span className="font-bold">Total: {requests.length} request{requests.length !== 1 ? 's' : ''}</span> • 
            <span className="text-amber-600 font-bold"> Pending: {getStatusCount('pending')}</span> • 
            <span className="text-emerald-600 font-bold"> Approved: {getStatusCount('approved')}</span> • 
            <span className="text-rose-600 font-bold"> Rejected: {getStatusCount('rejected')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <div className="text-xs text-slate-400">
              Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResubmissionRequests;
