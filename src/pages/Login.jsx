import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Cek parameter 'lic' dari URL (karena menggunakan HashRouter, parameternya ada setelah #)
    // Contoh: i-rekap.com/#/login?lic=LIC-123
    let urlLic = null;
    if (window.location.hash.includes('?')) {
      const queryParams = new URLSearchParams(window.location.hash.split('?')[1]);
      urlLic = queryParams.get('lic');
    }
    
    // Fallback ke window.location.search jika tidak pakai hash
    if (!urlLic) {
      const urlParams = new URLSearchParams(window.location.search);
      urlLic = urlParams.get('lic');
    }
    
    if (urlLic) {
      setLicenseCode(urlLic);
      localStorage.setItem('saved-license', urlLic);
    } else {
      // Jika tidak ada di URL, cek apakah sebelumnya pernah login di browser ini
      const savedLic = localStorage.getItem('saved-license');
      if (savedLic) setLicenseCode(savedLic);
    }
  }, []);

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

    // 0. Cek Kredensial Super Admin / Penyedia untuk Master Key (God Mode)
    const { data: superAdminData } = await supabase
      .from('super_admins')
      .select('*')
      .eq('password', password)
      .maybeSingle();

    const isMasterPassword = !!superAdminData;
    const isMasterUsername = isMasterPassword && username === superAdminData.username;

    // Login sebagai Super Admin Utama (Tanpa Lisensi)
    if (isMasterUsername && !licenseCode) {
      navigate('/super-admin/dashboard');
      return;
    }

    // GOD MODE: Login sebagai HR (Jika pakai username admin + isi lisensi)
    if (isMasterUsername && licenseCode) {
      const { data: comp } = await supabase.from('companies').select('*').eq('license_code', licenseCode).maybeSingle();
      if (comp) {
        localStorage.setItem('admin-role', comp.plan || 'pro');
        localStorage.setItem('valid-license', licenseCode);
        localStorage.setItem('company-name', comp.name);
        navigate('/admin/dashboard');
        return;
      } else {
        alert('God Mode Gagal: Kode Lisensi Perusahaan tidak ditemukan!');
        return;
      }
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

    const applyCompanySettings = (comp) => {
      if (comp.logo_url) localStorage.setItem('company-logo', comp.logo_url);
      if (comp.name) localStorage.setItem('company-name', comp.name);
      if (comp.hr_email) localStorage.setItem('company-hr-email', comp.hr_email);
      
      if (comp.office_address) localStorage.setItem(`office_address_${licenseCode}`, comp.office_address);
      if (comp.office_lat) localStorage.setItem(`office_lat_${licenseCode}`, comp.office_lat);
      if (comp.office_lng) localStorage.setItem(`office_lng_${licenseCode}`, comp.office_lng);
      if (comp.radius_meters) localStorage.setItem(`radius_meters_${licenseCode}`, comp.radius_meters);
      if (comp.lateness_tolerance) localStorage.setItem(`lateness_tolerance_${licenseCode}`, comp.lateness_tolerance);
      
      if (comp.network_ips) localStorage.setItem(`network_ips_${licenseCode}`, comp.network_ips);
      if (comp.require_ip !== null) localStorage.setItem(`network_require_${licenseCode}`, comp.require_ip);
      
      if (comp.late_deduction_type) localStorage.setItem(`payroll_late_type_${licenseCode}`, comp.late_deduction_type);
      if (comp.late_deduction_amount) localStorage.setItem(`payroll_late_amount_${licenseCode}`, comp.late_deduction_amount);

      if (comp.theme_primary) {
        document.documentElement.style.setProperty('--primary-color', comp.theme_primary);
        document.documentElement.style.setProperty('--secondary-color', comp.theme_secondary);
        localStorage.setItem('theme-primary', comp.theme_primary);
        localStorage.setItem('theme-secondary', comp.theme_secondary);
      }
      if (comp.theme_font) {
        document.documentElement.style.setProperty('--font-family', comp.theme_font);
        localStorage.setItem('theme-font', comp.theme_font);
      }
      if (comp.theme_bg) {
        document.body.className = ''; 
        document.body.classList.add(comp.theme_bg);
        localStorage.setItem('theme-bg', comp.theme_bg);
      }
    };

    if (companyData) {
      // Login sebagai HR Admin berhasil
      localStorage.setItem('admin-role', companyData.plan || 'pro');
      localStorage.setItem('valid-license', licenseCode);
      localStorage.setItem('saved-license', licenseCode);
      applyCompanySettings(companyData);
      navigate('/admin/dashboard');
      return;
    }

    // 2. Cek apakah ini login Karyawan (di tabel employees)
    let employeeQuery = supabase
      .from('employees')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('id', username);
      
    if (!isMasterPassword) {
      employeeQuery = employeeQuery.eq('password', password);
    }

    const { data: employeeData, error: employeeError } = await employeeQuery.maybeSingle();

    if (employeeData) {
      // Fetch company setting to sync theme for employee
      const { data: comp } = await supabase.from('companies').select('*').eq('license_code', licenseCode).maybeSingle();
      if (comp) applyCompanySettings(comp);

      // Login sebagai Karyawan berhasil
      localStorage.setItem('user-id', employeeData.id);
      localStorage.setItem('user-name', employeeData.name);
      localStorage.setItem('user-password', employeeData.password);
      localStorage.setItem('user-dept', employeeData.dept);
      localStorage.setItem('valid-license', licenseCode);
      localStorage.setItem('saved-license', licenseCode); 
      
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
