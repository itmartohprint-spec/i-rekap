import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const isDemo = username === localStorage.getItem('demo-username') && password === localStorage.getItem('demo-password');

    // Validasi Kode Lisensi untuk akun selain demo
    if (!isDemo) {
      if (!licenseCode) {
        alert('Silakan masukkan Kode Lisensi terlebih dahulu.');
        return;
      }
      
      const validLicense = localStorage.getItem('valid-license');
      if (licenseCode !== validLicense) {
        alert('Kode Lisensi tidak valid atau belum terdaftar di perangkat ini.');
        return;
      }
    }

    if (username === 'superadmin' || username === 'penyedia') {
      navigate('/super-admin/dashboard');
    } else if (username === 'admin') {
      localStorage.setItem('admin-role', 'pro');
      navigate('/admin/dashboard');
    } else if (username === localStorage.getItem('demo-username') && password === localStorage.getItem('demo-password')) {
      // Periksa masa aktif demo
      const expiryDate = new Date(localStorage.getItem('demo-expiry-date'));
      if (new Date() > expiryDate) {
        alert('Masa percobaan Demo Anda sudah habis. Silakan langganan paket Standar/Pro.');
        return;
      }
      localStorage.setItem('admin-role', 'demo');
      navigate('/admin/dashboard');
    } else {
      // Verify with Supabase
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', username)
        .eq('password', password)
        .single();

      if (data) {
        localStorage.setItem('user-id', data.id);
        localStorage.setItem('user-name', data.name);
        localStorage.setItem('user-password', data.password);
        localStorage.setItem('user-dept', data.dept);
        
        window.dispatchEvent(new Event('userProfileUpdated'));
        navigate('/user/dashboard');
      } else {
        alert('Login Gagal: ID Karyawan atau Password salah!');
      }
    }
  };

  return (
    <div className="login-split-container">
      {/* Left Abstract Visual */}
      <div className="login-visual">
        <div className="visual-content">
          <img src="/maskot.png" alt="i-rekap mascot" style={{ height: '280px', objectFit: 'contain', marginBottom: '2rem', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.3))' }} />
          <h1 className="visual-title" style={{ display: 'none' }}>i-rekap</h1>
          <p className="visual-subtitle">Platform Absensi & HRIS Generasi Baru</p>
        </div>
      </div>

      {/* Right Form */}
      <div className="login-form-wrapper">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Selamat Datang</h2>
            <p>Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="modern-input-group">
              <input 
                type="text" 
                className="modern-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                required 
              />
              <label className="modern-label">Username / NIK</label>
            </div>

            <div className="modern-input-group">
              <input 
                type="password" 
                className="modern-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required 
              />
              <label className="modern-label">Password</label>
            </div>

            <div className="modern-input-group">
              <input 
                type="text" 
                className="modern-input" 
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder="Kosongkan jika akun demo"
              />
              <label className="modern-label">Kode Lisensi (Cth: LIC-XXXX-XXXX)</label>
            </div>

            <button type="submit" className="btn-modern-login">
              Sign In
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;
