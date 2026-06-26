import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, Users, FileText, Calendar, Wallet, CalendarDays, DollarSign, Settings as SettingsIcon, LogOut, Fingerprint, ChevronLeft, ChevronRight, Upload, X, RefreshCcw } from 'lucide-react';
import './AdminLayout.css';

const MagicLogo = ({ src, className, style }) => {
  const [processedSrc, setProcessedSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    if (src.startsWith('data:image/png') || src.endsWith('.png')) {
      // It might already be a transparent PNG, but let's process it anyway just in case it has a white background baked in.
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const MAX_SIZE = 800;
      if (w > MAX_SIZE) {
        h = h * (MAX_SIZE / w);
        w = MAX_SIZE;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        // Fast single-pass white removal
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
            data[i+3] = 0; // Set alpha to 0 for white-ish pixels
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error("MagicLogo error:", e);
        setProcessedSrc(src);
      }
    };
    img.src = src;
  }, [src]);

  return <img src={processedSrc} className={className} style={style} alt="Company Logo" />;
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPhoto, setAdminPhoto] = useState(localStorage.getItem('admin-photo') || '');
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const photoInputRef = useRef(null);
  const adminRole = localStorage.getItem('admin-role') || 'pro';
  
  const [profile, setProfile] = useState({
    logo: localStorage.getItem('company-logo') || '/maskot.png',
    name: adminRole === 'demo' ? (localStorage.getItem('demo-company-name') || 'Akun Demo') : (localStorage.getItem('company-name') || 'PT Maju Bersama'),
    address: localStorage.getItem(`office_address_${localStorage.getItem('valid-license')}`) || 'Gedung i-rekap, Jl. Jend. Sudirman Kav. 21'
  });
  
  const handleRestrictedAccess = (e) => {
    if (adminRole === 'demo') {
      e.preventDefault();
      alert('🔒 Fitur ini dikunci. Silakan upgrade ke paket Standar atau Pro untuk mengakses fitur ini.');
    }
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(prev => ({
        ...prev,
        logo: localStorage.getItem('company-logo') || '/maskot.png',
        name: adminRole === 'demo' ? (localStorage.getItem('demo-company-name') || 'Akun Demo') : (localStorage.getItem('company-name') || 'PT Maju Bersama')
      }));
    };
    
    const handleLocationUpdate = () => {
      setProfile(prev => ({
        ...prev,
        address: localStorage.getItem(`office_address_${localStorage.getItem('valid-license')}`) || 'Gedung i-rekap, Jl. Jend. Sudirman Kav. 21'
      }));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('locationSettingsUpdated', handleLocationUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('locationSettingsUpdated', handleLocationUpdate);
    };
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Maksimal 2MB!");
      const reader = new FileReader();
      reader.onload = () => setAdminPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdminProfile = () => {
    if (passwords.new && passwords.new !== passwords.confirm) {
      return alert("Password baru dan konfirmasi tidak cocok!");
    }
    
    // Save Photo
    if (adminPhoto) {
      localStorage.setItem('admin-photo', adminPhoto);
    }
    
    // Mock save password
    if (passwords.new) {
      localStorage.setItem('admin-password', passwords.new);
    }

    alert("✅ Profil Admin berhasil diperbarui!");
    setShowAdminModal(false);
    setPasswords({ old: '', new: '', confirm: '' });
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ overflow: 'visible', width: '100%' }}>
            <img className="logo-animated" src={profile.logo} style={{ height: '80px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }} alt="Company Logo" />
          </div>
          <button className="btn-collapse" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Dashboard">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/gps" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Lacak GPS">
            <MapPin size={20} />
            <span>Lacak GPS</span>
          </NavLink>
          <NavLink to="/admin/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Data Karyawan">
            <Users size={20} />
            <span>Data Karyawan</span>
          </NavLink>
          <NavLink to="/admin/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Log Absensi">
            <FileText size={20} />
            <span>Log Absensi</span>
          </NavLink>
          <NavLink to="/admin/leave" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Izin, Cuti & Sakit">
            <Calendar size={20} />
            <span>Izin, Cuti & Sakit</span>
          </NavLink>
          <NavLink to="/admin/cash-advance" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Kasbon">
            <Wallet size={20} />
            <span>Kasbon</span>
          </NavLink>
          <NavLink to="/admin/shift" onClick={handleRestrictedAccess} className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Jadwal Shift">
            <CalendarDays size={20} />
            <span>Jadwal Shift {adminRole === 'demo' && '🔒'}</span>
          </NavLink>
          <NavLink to="/admin/payroll" onClick={handleRestrictedAccess} className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Penggajian & Lembur">
            <DollarSign size={20} />
            <span>Penggajian & Lembur {adminRole === 'demo' && '🔒'}</span>
          </NavLink>
          <NavLink to="/admin/settings" onClick={handleRestrictedAccess} className={({isActive}) => isActive ? "nav-item active" : "nav-item"} title="Pengaturan">
            <SettingsIcon size={20} />
            <span>Pengaturan {adminRole === 'demo' && '🔒'}</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout} title="Keluar">
            <LogOut size={20} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="company-name-animated" style={{ display: 'block', fontWeight: '900', fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{profile.name}</span>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{profile.address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
            <div className="admin-profile" onClick={(e) => {
              if (adminRole === 'demo') {
                handleRestrictedAccess(e);
              } else {
                setShowAdminModal(true);
              }
            }} style={{ cursor: adminRole === 'demo' ? 'not-allowed' : 'pointer' }}>
              <span>HR Manager {adminRole === 'demo' && '🔒'}</span>
              <div className="avatar">
                {adminPhoto ? (
                  <img src={adminPhoto} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  "HR"
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      {/* Admin Profile Modal */}
      {showAdminModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content glass-panel fade-in">
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Pengaturan Profil Admin</h3>
              <button onClick={() => setShowAdminModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Foto Profil</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                    {adminPhoto ? (
                      <img src={adminPhoto} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      "HR"
                    )}
                  </div>
                  <div>
                    <input type="file" ref={photoInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                    <button className="btn-secondary" onClick={() => photoInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                      <Upload size={16} /> Ubah Foto
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Ubah Password</h4>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Password Saat Ini</label>
                  <input type="password" className="form-input" value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} placeholder="Masukkan password lama" />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Password Baru</label>
                  <input type="password" className="form-input" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="Minimal 6 karakter" />
                </div>
                <div className="form-group">
                  <label className="form-label">Konfirmasi Password Baru</label>
                  <input type="password" className="form-input" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="Ulangi password baru" />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={() => setShowAdminModal(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSaveAdminProfile}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
