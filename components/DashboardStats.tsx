// components/DashboardStats.tsx
import React from 'react';
import { 
  Users, BookOpen, CheckCircle2, Clock, AlertTriangle, 
  Mail, BarChart, TrendingUp, Calendar, Award, Sparkles,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { Teacher, LessonPlan, LoginLog } from '../types';
import { getUpcomingMonday, formatDate } from '../utils';

interface DashboardStatsProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  loginLogs: LoginLog[];
  resubmissionRequests: any[];
  onRefresh: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  teachers,
  lessonPlans,
  loginLogs,
  resubmissionRequests,
  onRefresh
}) => {
  const upcomingMonday = getUpcomingMonday();
  const weekLabel = `${formatDate(upcomingMonday)} - ${formatDate(new Date(upcomingMonday.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
  
  // Calculate stats
  const totalTeachers = teachers.length;
  const submittedThisWeek = new Set(
    lessonPlans
      .filter(plan => plan.weekStarting === upcomingMonday.toISOString())
      .map(plan => plan.teacherId)
  ).size;
  const defaultersCount = totalTeachers - submittedThisWeek;
  const submissionRate = totalTeachers > 0 ? (submittedThisWeek / totalTeachers * 100).toFixed(1) : '0';
  
  const todayLogins = loginLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;
  
  const pendingResubmissions = resubmissionRequests.length;

  // Recent activity
  const recentLogins = loginLogs.slice(0, 5);
  const recentSubmissions = lessonPlans
    .filter(plan => new Date(plan.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-bold mt-2">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
          >
            <RefreshCw className="h-5 w-5 text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-bold">Last Updated</div>
            <div className="text-sm font-black text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{totalTeachers}</div>
          <div className="text-sm font-bold text-indigo-300">Total Faculty</div>
          <div className="text-xs text-gray-400 mt-2">Active teaching staff</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-emerald-400 text-sm font-black bg-emerald-500/20 px-2 py-1 rounded-lg">
              {submissionRate}%
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-2">{submittedThisWeek}</div>
          <div className="text-sm font-bold text-emerald-300">Submitted This Week</div>
          <div className="text-xs text-gray-400 mt-2">Week: {weekLabel}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <ArrowDownRight className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{defaultersCount}</div>
          <div className="text-sm font-bold text-amber-300">Pending Submissions</div>
          <div className="text-xs text-gray-400 mt-2">Reminders scheduled</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-purple-400 text-sm font-black bg-purple-500/20 px-2 py-1 rounded-lg">
              Today
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-2">{todayLogins}</div>
          <div className="text-sm font-bold text-purple-300">Today's Logins</div>
          <div className="text-xs text-gray-400 mt-2">Active users</div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Resubmissions */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-white">Pending Resubmissions</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                {pendingResubmissions} Requests
              </span>
            </div>
          </div>
          
          {pendingResubmissions > 0 ? (
            <div className="space-y-4">
              {resubmissionRequests.slice(0, 3).map((request, idx) => (
                <div key={idx} className="p-4 bg-gray-900/30 rounded-xl border border-gray-700 hover:bg-gray-800/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-bold text-white">{request.teacher_name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {request.class_sections?.length || 0} classes • Requested: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.class_sections?.slice(0, 2).map((cs: any, i: number) => (
                          <span key={i} className="text-xs font-black bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg">
                            {cs.className}-{cs.section}
                          </span>
                        ))}
                        {request.class_sections?.length > 2 && (
                          <span className="text-xs font-black bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">
                            +{request.class_sections.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-xs font-black uppercase hover:from-amber-500 hover:to-orange-500 transition-all">
                      Review
                    </button>
                  </div>
                </div>
              ))}
              {pendingResubmissions > 3 && (
                <button className="w-full py-3 text-center text-sm font-bold text-gray-400 hover:text-white border border-dashed border-gray-700 rounded-xl hover:border-gray-600 transition-colors">
                  View all {pendingResubmissions} requests →
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-emerald-400/30 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No pending resubmission requests</p>
              <p className="text-gray-500 text-sm mt-1">All requests have been processed</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
          <h3 className="text-lg font-black text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentLogins.map((log, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-xl">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Users className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white truncate">{log.name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              </div>
            ))}
            
            {recentSubmissions.map((plan, idx) => (
              <div key={`sub-${idx}`} className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-xl">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white truncate">{plan.subject}</div>
                  <div className="text-xs text-gray-400">
                    {plan.className}-{plan.section} • {plan.teacherId.split('@')[0]}
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg font-black text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Send Reminders</div>
                <div className="text-xs text-gray-400">To defaulters</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <BarChart className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Generate Reports</div>
                <div className="text-xs text-gray-400">Weekly compilation</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Review Requests</div>
                <div className="text-xs text-gray-400">Pending approvals</div>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">Schedule Tasks</div>
                <div className="text-xs text-gray-400">Automate processes</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
