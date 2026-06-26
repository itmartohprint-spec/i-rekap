import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Users, CheckCircle, Clock, XCircle, TrendingUp, Calendar } from 'lucide-react';
import '../index.css'; // Make sure the global CSS is loaded

const LiveMonitor = () => {
  const { licenseCode } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Perusahaan');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!licenseCode) {
      navigate('/');
      return;
    }
    
    // Live clock updater
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetchRealData();
    // Auto refresh data every 60 seconds
    const dataTimer = setInterval(fetchRealData, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, [licenseCode, navigate]);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Total Employees & Company Name (from the first employee)
      const { data: employees, count: empCount } = await supabase
        .from('employees')
        .select('name', { count: 'exact' })
        .eq('license_code', licenseCode);

      if (employees && employees.length > 0) {
        // Just a fallback if company name isn't stored centrally
        setCompanyName('Dashboard Pimpinan');
      }

      // 2. Get Today's Attendance
      const today = new Date().toLocaleDateString('en-CA');
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          id, 
          employee_id, 
          date, 
          time_in,
          time_out,
          type,
          status, 
          employees (name)
        `)
        .eq('license_code', licenseCode)
        .order('id', { ascending: false });

      // Calculate stats based on today
      const todaysLogs = attendanceData ? attendanceData.filter(log => log.date === today && log.type === 'in') : [];
      
      const presentEmployees = new Set(todaysLogs.map(log => log.employee_id));
      const present = presentEmployees.size;
      const lateEmployees = new Set(todaysLogs.filter(log => log.status === 'late' || log.status === 'Terlambat').map(log => log.employee_id));
      const late = lateEmployees.size;
      const totalEmp = empCount || 0;
      const absent = Math.max(0, totalEmp - present);

      setStats({
        totalEmployees: totalEmp,
        presentToday: present,
        lateToday: late,
        absentToday: absent
      });

      // Format recent logs for the table
      if (attendanceData) {
        const formattedLogs = todaysLogs.slice(0, 10).map(log => ({
          id: log.id,
          employeeName: log.employees ? log.employees.name : log.employee_id,
          time: log.time_in || log.time_out || '-',
          status: log.status
        }));
        setRecentLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-primary)', padding: '20px', fontFamily: 'var(--font-family)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ 
          background: 'var(--primary-color)', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '30px',
          fontWeight: 'bold',
          marginBottom: '15px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={18} />
          Live Monitor
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0' }}>{companyName}</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={14} /> 
          {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '10px', color: 'var(--primary-color)' }}>
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-color)', marginBottom: '10px' }}><Users size={30} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Karyawan</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{isLoading ? '-' : stats.totalEmployees}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: 'var(--success-color)', marginBottom: '10px' }}><CheckCircle size={30} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hadir (Hari Ini)</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{isLoading ? '-' : stats.presentToday}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: 'var(--warning-color)', marginBottom: '10px' }}><Clock size={30} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Terlambat</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{isLoading ? '-' : stats.lateToday}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: 'var(--danger-color)', marginBottom: '10px' }}><XCircle size={30} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Absen (Alpha)</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{isLoading ? '-' : stats.absentToday}</div>
        </div>

      </div>

      {/* Recent Logs List */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--text-primary)' }}>Presensi Masuk Terbaru</h3>
      <div className="glass-panel" style={{ padding: '15px', borderRadius: '15px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Memuat data realtime...</div>
        ) : recentLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px',
                borderBottom: '1px solid var(--glass-border)'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{log.employeeName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hari ini, {log.time}</div>
                </div>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    background: log.status === 'Terlambat' || log.status === 'late' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: log.status === 'Terlambat' || log.status === 'late' ? 'var(--warning-color)' : 'var(--success-color)'
                  }}>
                    {log.status === 'Terlambat' || log.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Belum ada karyawan yang absen hari ini.
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>Data diperbarui secara otomatis secara real-time.</p>
        <p>© 2026 i-rekap System</p>
      </div>

    </div>
  );
};

export default LiveMonitor;
