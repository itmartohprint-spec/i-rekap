import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Clock, MapPin, Camera, RefreshCcw, Bell, Upload, X, Activity, Timer, Zap, ZapOff, Building, Power } from 'lucide-react';
import AttendanceForm from '../components/AttendanceForm';
import QuickLeaveForm from '../components/QuickLeaveForm';
import { supabase } from '../lib/supabaseClient';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showQuickLeave, setShowQuickLeave] = useState(false);
  const [attendanceType, setAttendanceType] = useState('in'); // 'in', 'out', 'early', 'overtime_in', 'overtime_out'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userPhoto, setUserPhoto] = useState(localStorage.getItem('user-photo') || '');
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [todayHistory, setTodayHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const photoInputRef = useRef(null);

  const userId = localStorage.getItem('user-id');
  const licenseCode = localStorage.getItem('valid-license');
  const userName = localStorage.getItem('user-name') || 'Karyawan';
  const userDept = localStorage.getItem('user-dept') || 'Staff';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchTodayHistory();
    
    // Listen for custom event when attendance is submitted
    const handleAttendanceUpdate = () => fetchTodayHistory();
    window.addEventListener('attendanceSubmitted', handleAttendanceUpdate);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('attendanceSubmitted', handleAttendanceUpdate);
    };
  }, []);

  const fetchTodayHistory = async () => {
    setIsLoadingHistory(true);
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('employee_id', userId)
      .eq('date', today)
      .order('id', { ascending: false });
      
    if (data) {
      setTodayHistory(data);
    }
    setIsLoadingHistory(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Maksimal 2MB!");
      const reader = new FileReader();
      reader.onload = () => setUserPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (passwords.new && passwords.new !== passwords.confirm) {
      return alert("Password baru dan konfirmasi tidak cocok!");
    }
    
    if (userPhoto) {
      localStorage.setItem('user-photo', userPhoto);
    }
    
    if (passwords.new) {
      localStorage.setItem('user-password', passwords.new);
    }

    // trigger custom event to notify other tabs/components in the same window
    window.dispatchEvent(new Event('userProfileUpdated'));

    alert("✅ Profil berhasil diperbarui!");
    setShowProfileModal(false);
    setPasswords({ old: '', new: '', confirm: '' });
  };

  const handleOpenAttendance = (type) => {
    if (type === 'leave') {
      setShowQuickLeave(true);
    } else {
      setAttendanceType(type);
      setShowAttendanceForm(true);
    }
  };

  const handleCloseAttendance = () => {
    setShowAttendanceForm(false);
    setShowQuickLeave(false);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="mobile-container">
      <div className="user-dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-1.5rem', color: 'white', marginTop: '-1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
              <img src="/logo-irekap.png" alt="i-Rekap" style={{ height: '100%', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div style={{ display: 'none', background: 'white', padding: '0.5rem', borderRadius: '14px', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <Building size={28} color="#0062ff" />
              </div>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>i-Rekap</span>
          </div>
          
          <button 
            onClick={() => {
              if(window.confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.removeItem('user-id');
                localStorage.removeItem('user-name');
                localStorage.removeItem('user-dept');
                navigate('/login');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fee2e2',
              padding: '0.4rem 0.8rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              marginRight: '0.5rem'
            }}
            title="Logout"
          >
            <Power size={14} />
            Logout
          </button>
        </div>
        <header className="dashboard-header">
          <div className="user-greeting">
            <h1>Halo, {userName.split(' ')[0]}!</h1>
            <p>{userDept}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
            <button 
              onClick={() => navigate('/user/info')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}
            >
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #3b82f6' }}></span>
            </button>
            <div 
              className="avatar" 
              onClick={() => setShowProfileModal(true)} 
              style={{ cursor: 'pointer', overflow: 'hidden' }}
              title="Edit Profil"
            >
              {userPhoto ? <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'B'}
            </div>
          </div>
        </header>

        <section className="glass-panel status-card">
          <div className="time-display">{formatTime(currentTime)}</div>
          <div className="date-display">{formatDate(currentTime)}</div>
          
          <div className="action-buttons">
            <button 
              className="btn-checkin" 
              onClick={() => handleOpenAttendance('in')}
              disabled={todayHistory.some(log => log.type === 'in')}
              style={todayHistory.some(log => log.type === 'in') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <LogIn size={24} />
              {todayHistory.some(log => log.type === 'in') ? 'Sudah Masuk' : 'Absen Masuk'}
            </button>
            <button 
              className="btn-checkout" 
              onClick={() => handleOpenAttendance('out')}
              disabled={todayHistory.some(log => log.type === 'out')}
              style={todayHistory.some(log => log.type === 'out') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <LogOut size={24} />
              {todayHistory.some(log => log.type === 'out') ? 'Sudah Pulang' : 'Absen Pulang'}
            </button>
            <button 
              className="btn-leave" 
              onClick={() => handleOpenAttendance('leave')}
              disabled={todayHistory.some(log => log.type === 'leave' || log.type === 'Sakit' || log.type === 'Izin')}
              style={todayHistory.some(log => log.type === 'leave' || log.type === 'Sakit' || log.type === 'Izin') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Activity size={24} />
              Izin / Sakit
            </button>
            <button 
              className="btn-early" 
              onClick={() => handleOpenAttendance('early')}
              disabled={todayHistory.some(log => log.type === 'early')}
              style={todayHistory.some(log => log.type === 'early') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Timer size={24} />
              Pulang Cepat
            </button>
            <button 
              className="btn-overtime-in" 
              onClick={() => handleOpenAttendance('overtime_in')}
              disabled={todayHistory.some(log => log.type === 'overtime_in')}
              style={todayHistory.some(log => log.type === 'overtime_in') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Zap size={24} />
              Lembur Masuk
            </button>
            <button 
              className="btn-overtime-out" 
              onClick={() => handleOpenAttendance('overtime_out')}
              disabled={todayHistory.some(log => log.type === 'overtime_out')}
              style={todayHistory.some(log => log.type === 'overtime_out') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <ZapOff size={24} />
              Lembur Keluar
            </button>
          </div>
        </section>


      </div>

      {showAttendanceForm && (
        <div className="modal-overlay">
          <AttendanceForm type={attendanceType} onClose={handleCloseAttendance} />
        </div>
      )}

      {showQuickLeave && (
        <div className="modal-overlay">
          <QuickLeaveForm onClose={handleCloseAttendance} />
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', background: 'white', color: '#0f172a', padding: '1.5rem', borderRadius: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Edit Profil</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Foto Profil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="avatar" style={{ width: '64px', height: '64px', overflow: 'hidden' }}>
                  {userPhoto ? <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'B'}
                </div>
                <div>
                  <input type="file" ref={photoInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                  <button onClick={() => photoInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    <Upload size={16} /> Ubah Foto
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Ubah Password</h4>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Password Saat Ini</label>
                <input type="password" value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Password Baru</label>
                <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Konfirmasi Password</label>
                <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button onClick={handleSaveProfile} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #0062ff, #3b82f6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
