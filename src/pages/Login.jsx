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

    if (isDemo) {
      const expiryDate = new Date(localStorage.getItem('demo-expiry-date'));
      if (new Date() > expiryDate) {
        alert('Masa percobaan Demo Anda sudah habis. Silakan langganan paket Standar/Pro.');
        return;
      }
      localStorage.setItem('admin-role', 'demo');
      navigate('/admin/dashboard');
      return;
    }

    if (username === 'superadmin' || username === 'penyedia') {
      navigate('/super-admin/dashboard');
      return;
    }

    // Validasi Kode Lisensi wajib untuk selain demo & superadmin
    if (!licenseCode) {
      alert('Silakan masukkan Kode Lisensi terlebih dahulu.');
      return;
    }

    // 1. Cek apakah ini login HR Admin (di tabel companies)
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('email', username)
      .eq('admin_password', password)
      .maybeSingle();

    if (companyData) {
      // Login sebagai HR Admin berhasil
      localStorage.setItem('admin-role', companyData.plan || 'pro');
      localStorage.setItem('valid-license', licenseCode);
      localStorage.setItem('company-name', companyData.name);
      navigate('/admin/dashboard');
      return;
    }

    // 2. Cek apakah ini login Karyawan (di tabel employees)
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('id', username)
      .eq('password', password)
      .maybeSingle();

    if (employeeData) {
      // Login sebagai Karyawan berhasil
      localStorage.setItem('user-id', employeeData.id);
      localStorage.setItem('user-name', employeeData.name);
      localStorage.setItem('user-password', employeeData.password);
      localStorage.setItem('user-dept', employeeData.dept);
      localStorage.setItem('valid-license', licenseCode);
      
      window.dispatchEvent(new Event('userProfileUpdated'));
      navigate('/user/dashboard');
      return;
    }

    // Jika tidak ada yang cocok
    alert('Login Gagal: Kombinasi Username/Email, Password, atau Kode Lisensi salah!');
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
