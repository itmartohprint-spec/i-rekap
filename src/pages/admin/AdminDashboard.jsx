import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [announcement, setAnnouncement] = useState({ title: '', content: '', type: 'info' });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const rawLogs = JSON.parse(localStorage.getItem('attendance_logs')) || [];
    setRecentLogs(rawLogs.slice(0, 5)); // Show latest 5

    // Listen for storage changes if same window, but usually handled by reload in simple mocks
  }, []);

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content) return alert('Judul dan isi pengumuman harus diisi!');
    
    const newAnnouncement = {
      id: Date.now(),
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    const existing = JSON.parse(localStorage.getItem('hr-announcements') || '[]');
    const updated = [newAnnouncement, ...existing];
    localStorage.setItem('hr-announcements', JSON.stringify(updated));

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
            <p>150</p>
          </div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={28} />
          </div>
          <div className="stat-details">
            <h4>Hadir Hari Ini</h4>
            <p>142</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
            <Clock size={28} />
          </div>
          <div className="stat-details">
            <h4>Terlambat</h4>
            <p>5</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
            <XCircle size={28} />
          </div>
          <div className="stat-details">
            <h4>Absen (Alpha)</h4>
            <p>3</p>
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
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.employeeName}</td>
                  <td>{log.time}</td>
                  <td style={{ textTransform: 'capitalize' }}>{log.type.replace('_', ' ')}</td>
                  <td><span className="status-badge badge-success">{log.status}</span></td>
                  <td>Valid</td>
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
