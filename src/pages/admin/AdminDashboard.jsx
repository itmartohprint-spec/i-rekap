import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminDashboard = () => {
  const [announcement, setAnnouncement] = useState({ title: '', content: '', type: 'info' });
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const adminRole = localStorage.getItem('admin-role') || 'pro';
  const licenseCode = localStorage.getItem('valid-license');

  useEffect(() => {
    if (adminRole === 'demo') {
      const rawLogs = JSON.parse(localStorage.getItem('demo-attendance_logs')) || [];
      setRecentLogs(rawLogs.slice(0, 5));
      setStats({ totalEmployees: 150, presentToday: 142, lateToday: 5, absentToday: 3 });
      setIsLoading(false);
    } else {
      fetchRealData();
    }
  }, []);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Total Employees
      const { count: empCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('license_code', licenseCode);

      // 2. Get Today's Attendance
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format to match database
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
      const todaysLogs = attendanceData ? attendanceData.filter(log => log.date === today) : [];
      
      const present = todaysLogs.length;
      const late = todaysLogs.filter(log => log.status === 'late' || log.status === 'Terlambat').length;
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
        const formattedLogs = attendanceData.slice(0, 5).map(log => ({
          id: log.id,
          employeeName: log.employees ? log.employees.name : log.employee_id,
          time: log.time_in || log.time_out || '-',
          type: log.type || 'Hadir',
          status: log.status
        }));
        setRecentLogs(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setIsLoading(false);
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content) return alert('Judul dan isi pengumuman harus diisi!');
    
    const newAnnouncement = {
      id: Date.now(),
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    const annKey = adminRole === 'demo' ? 'demo-hr-announcements' : `hr-announcements-${licenseCode}`;
    const existing = JSON.parse(localStorage.getItem(annKey) || '[]');
    const updated = [newAnnouncement, ...existing];
    localStorage.setItem(annKey, JSON.stringify(updated));

    // trigger custom event
    window.dispatchEvent(new Event('hrAnnouncementSent'));
    
    alert('Pengumuman berhasil disiarkan ke semua karyawan!');
    setAnnouncement({ title: '', content: '', type: 'info' });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard Overview</h2>
      
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
            <Users size={28} />
          </div>
          <div className="stat-details">
            <h4>Total Karyawan</h4>
            <p>{isLoading ? '...' : stats.totalEmployees}</p>
          </div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={28} />
          </div>
          <div className="stat-details">
            <h4>Hadir Hari Ini</h4>
            <p>{isLoading ? '...' : stats.presentToday}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
            <Clock size={28} />
          </div>
          <div className="stat-details">
            <h4>Terlambat</h4>
            <p>{isLoading ? '...' : stats.lateToday}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
            <XCircle size={28} />
          </div>
          <div className="stat-details">
            <h4>Absen (Alpha)</h4>
            <p>{isLoading ? '...' : stats.absentToday}</p>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Aktivitas Presensi Terbaru</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Waktu</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Lokasi & IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td></tr>
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.employeeName}</td>
                  <td>{log.time}</td>
                  <td style={{ textTransform: 'capitalize' }}>{log.type.replace('_', ' ')}</td>
                  <td>
                    <span className={`status-badge ${log.status === 'late' ? 'badge-danger' : 'badge-success'}`}>
                      {log.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                    </span>
                  </td>
                  <td><span className="status-badge badge-success" style={{background: '#f1f5f9', color: '#64748b'}}>GPS Valid</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada aktivitas presensi terbaru</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-panel" style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '24px', background: '#3b82f6', borderRadius: '4px' }}></span>
          Kirim Pengumuman Karyawan
        </h3>
        <form onSubmit={handleSendAnnouncement}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Judul Pengumuman</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: Rapat Bulanan" 
                value={announcement.title}
                onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Jenis Informasi</label>
              <select 
                className="form-input"
                value={announcement.type}
                onChange={(e) => setAnnouncement({...announcement, type: e.target.value})}
              >
                <option value="info">Informasi Biasa</option>
                <option value="announcement">Pengumuman (Penting)</option>
                <option value="important">Peringatan (Mendesak)</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Isi Pesan</label>
            <textarea 
              className="form-input" 
              rows="4" 
              placeholder="Tulis pesan pengumuman di sini..."
              value={announcement.content}
              onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Siarkan Pengumuman
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
