import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username === 'superadmin' || username === 'penyedia') {
      navigate('/super-admin/dashboard');
    } else if (username === 'admin') {
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
          <img src="/logo.png" alt="i-rekap logo" style={{ height: '120px', objectFit: 'contain', marginBottom: '2rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }} />
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

            <button type="submit" className="btn-modern-login">
              Sign In
            </button>
          </form>

          <p className="role-hint">
            Petunjuk: Gunakan "admin" untuk Portal HRD, "penyedia" untuk Portal Pengelola, atau gunakan ID Karyawan yang sudah didaftarkan HR untuk masuk ke Portal Karyawan Mobile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
