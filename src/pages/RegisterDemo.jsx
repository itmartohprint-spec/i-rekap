import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Lock, Building, CheckCircle } from 'lucide-react';
import './RegisterDemo.css';

const RegisterDemo = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.username || !formData.password) {
      alert('Semua field wajib diisi!');
      return;
    }

    // Save demo admin credentials to localStorage
    localStorage.setItem('demo-company-name', formData.companyName);
    localStorage.setItem('demo-username', formData.username);
    localStorage.setItem('demo-password', formData.password);
    
    // Set demo expiration date (14 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);
    localStorage.setItem('demo-expiry-date', expiryDate.toISOString());

    alert('Akun Demo Berhasil Dibuat! Silakan login menggunakan username & password Anda.');
    navigate('/login');
  };

  return (
    <div className="register-demo-container">
      <div className="register-demo-content">
        <div className="register-header">
          <div className="register-logo">
            <h1 className="logo-text">i-Rekap</h1>
          </div>
          <h2>Daftar Akun Demo</h2>
          <p>Coba semua fitur unggulan selama 14 hari tanpa biaya.</p>
        </div>

        <div className="register-benefits">
          <div className="benefit-item">
            <CheckCircle size={16} color="var(--success-color)" /> Akses fitur Absensi & Laporan
          </div>
          <div className="benefit-item">
            <CheckCircle size={16} color="var(--success-color)" /> Tanpa kartu kredit
          </div>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <label>Nama Perusahaan</label>
            <div className="input-with-icon">
              <Building size={20} className="input-icon" />
              <input 
                type="text" 
                placeholder="PT Sukses Makmur"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Username (Admin)</label>
            <div className="input-with-icon">
              <User size={20} className="input-icon" />
              <input 
                type="text" 
                placeholder="admin.demo"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                placeholder="Masukkan password kuat"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-100 register-btn">Mulai Masa Demo</button>
          
          <div className="login-prompt">
            Sudah punya akun? <span onClick={() => navigate('/login')}>Login di sini</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterDemo;
