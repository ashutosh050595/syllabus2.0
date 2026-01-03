import React, { useState } from 'react';
import { Clock, User, Calendar, Search, Filter, Download } from 'lucide-react';
import { LoginLog } from '../types';

interface TeacherLoginHistoryProps {
  loginLogs: LoginLog[];
}

const TeacherLoginHistory: React.FC<TeacherLoginHistoryProps> = ({ loginLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Get unique teachers
  const teachers = Array.from(new Set(loginLogs.map(log => log.email)))
    .map(email => {
      const log = loginLogs.find(l => l.email === email);
      return { email, name: log?.name || email };
    })
    .filter(t => t.email !== 'admin');

  // Filter logs
  const filteredLogs = loginLogs.filter(log => {
    if (searchTerm && !log.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (selectedTeacher !== 'all' && log.email !== selectedTeacher) return false;
    
    if (dateRange.from && dateRange.to) {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      if (logDate < fromDate || logDate > toDate) return false;
    }
    
    return true;
  });

  // Group logs by teacher
  const logsByTeacher = filteredLogs.reduce((acc, log) => {
    if (!acc[log.email]) {
      acc[log.email] = {
        teacher: { name: log.name, email: log.email },
        logs: []
      };
    }
    acc[log.email].logs.push(log);
    return acc;
  }, {} as Record<string, { teacher: { name: string; email: string }; logs: LoginLog[] }>);

  // Get login statistics
  const getLoginStats = (email: string) => {
    const logs = filteredLogs.filter(log => log.email === email);
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const last7Days = logs.filter(log => new Date(log.timestamp) >= sevenDaysAgo).length;
    const total = logs.length;
    const lastLogin = logs.length > 0 ? new Date(logs[0].timestamp) : null;
    
    return { total, last7Days, lastLogin };
  };

  const handleExportCSV = () => {
    const headers = ['Teacher Name', 'Email', 'Login Date', 'Login Time'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.name}"`,
        `"${log.email}"`,
        `"${new Date(log.timestamp).toLocaleDateString()}"`,
        `"${new Date(log.timestamp).toLocaleTimeString()}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-login-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">Teacher Login History</h3>
          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
            Track faculty access patterns and activity
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher name or email..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="all">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.email} value={teacher.email}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
        </div>
        
        <div>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Unique Teachers</div>
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-900">{teachers.length}</div>
        </div>
        
        <div className="bg-emerald-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Logins</div>
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900">{filteredLogs.length}</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Avg. Daily Logins</div>
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-900">
            {filteredLogs.length > 0 ? Math.round(filteredLogs.length / 30) : 0}
          </div>
        </div>
      </div>

      {/* Teacher List */}
      <div className="space-y-6">
        {Object.values(logsByTeacher).map(({ teacher, logs }) => {
          const stats = getLoginStats(teacher.email);
          
          return (
            <div key={teacher.email} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 italic">{teacher.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Logins</div>
                        <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last 7 Days</div>
                        <div className="text-2xl font-black text-emerald-600">{stats.last7Days}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {logs.slice(0, 20).map((log, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <Clock className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-900">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[9px] font-bold text-slate-500">
                        IP: {log.ip || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
                
                {logs.length > 20 && (
                  <div className="text-center mt-4">
                    <p className="text-[10px] text-slate-400 font-bold">
                      Showing 20 of {logs.length} logins
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {Object.keys(logsByTeacher).length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No login records found</p>
            <p className="text-[10px] text-slate-300 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLoginHistory;
