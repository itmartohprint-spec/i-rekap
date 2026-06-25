import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, LogOut, ShieldCheck, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  
  // Avatar state
  const [superAvatar, setSuperAvatar] = useState(localStorage.getItem('super-avatar') || '');

  useEffect(() => {
    if (showProfileModal) {
      fetchSuperAdminCreds();
    }
  }, [showProfileModal]);

  const fetchSuperAdminCreds = async () => {
    const { data } = await supabase.from('super_admins').select('*').limit(1).maybeSingle();
    if (data) {
      setAdminUsername(data.username);
      setAdminPassword(data.password);
    }
  };

  const handleUpdateCreds = async (e) => {
    e.preventDefault();
    setIsUpdatingCreds(true);
    
    const { data } = await supabase.from('super_admins').select('id').limit(1).maybeSingle();
    
    if (data) {
      const { error } = await supabase.from('super_admins').update({
        username: adminUsername,
        password: adminPassword
      }).eq('id', data.id);
      
      if (!error) {
        alert("Profil Penyedia berhasil diperbarui!");
        setShowProfileModal(false);
      } else {
        alert("Gagal memperbarui: " + error.message);
      }
    }
    
    setIsUpdatingCreds(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSuperAvatar(reader.result);
        localStorage.setItem('super-avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="super-admin-layout">
      <aside className="super-sidebar">
        <div className="super-logo">
          <h2 style={{margin:0}}>i-Rekap</h2>
        </div>
        
        <nav className="super-nav">
          <NavLink to="/super-admin/dashboard" className={({isActive}) => isActive ? "super-nav-item active" : "super-nav-item"}>
            <LayoutDashboard size={20} />
            Manajemen Pelanggan
          </NavLink>
        </nav>

        <div className="super-footer">
          <button className="super-logout" onClick={handleLogout}>
            <LogOut size={20} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      <div className="super-content">
        <header className="super-header">
          <div 
            className="super-profile" 
            onClick={() => setShowProfileModal(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Penyedia Layanan</span>
            {superAvatar ? (
              <img src={superAvatar} alt="Super Admin" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
            ) : (
              <div className="super-avatar">P</div>
            )}
          </div>
        </header>

        <main className="super-main">
          <Outlet />
        </main>
      </div>

      {/* Modal Profil Penyedia */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', position: 'relative', border: '1px solid #334155' }}>
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>Profil Penyedia</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', border: '3px solid #3b82f6' }}>
                {superAvatar ? (
                  <img src={superAvatar} alt="Super Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ShieldCheck size={40} color="#94a3b8" />
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/png, image/jpeg"
                onChange={handleAvatarUpload}
              />
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => fileInputRef.current.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', color: '#60a5fa', border: '1px solid #3b82f6' }}
              >
                <Upload size={16} /> Ubah Foto Profil
              </button>
            </div>

            <form onSubmit={handleUpdateCreds} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={isUpdatingCreds} style={{ marginTop: '1rem', width: '100%' }}>
                {isUpdatingCreds ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLayout;
