import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Wifi, Palette, Bell, Building, Globe, Check, Upload, Database, Download, RefreshCw, AlertTriangle, Coins } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('lokasi');
  const fileInputRef = useRef(null);

  const [companyProfile, setCompanyProfile] = useState({
    logo: localStorage.getItem('company-logo') || '/maskot.png',
    name: localStorage.getItem('company-name') || 'PT Maju Bersama',
    hrEmail: localStorage.getItem('company-hr-email') || 'hr@majubersama.com'
  });

  const [locationSettings, setLocationSettings] = useState({
    officeAddress: 'Gedung i-rekap, Jl. Jend. Sudirman Kav. 21, Jakarta Selatan 12920',
    officeLat: '-6.200000',
    officeLng: '106.816666',
    radiusMeters: '50',
    latenessTolerance: '15'
  });

  const [networkSettings, setNetworkSettings] = useState({
    ipAddresses: '192.168.1.100, 114.120.30.22',
    requireIp: true
  });

  const [payrollSettings, setPayrollSettings] = useState({
    lateDeductionType: 'proportional', // 'proportional', 'flat_minute', 'flat_incident'
    lateDeductionAmount: '0'
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return;

    // Ambil data global dari Supabase
    const { data: comp } = await supabase.from('companies').select('*').eq('license_code', licenseCode).single();
    if (comp) {
      setCompanyProfile({
        logo: comp.logo_url || localStorage.getItem('company-logo') || '/maskot.png',
        name: comp.name || localStorage.getItem('company-name') || 'PT Maju Bersama',
        hrEmail: comp.hr_email || localStorage.getItem('company-hr-email') || 'hr@majubersama.com'
      });

      setLocationSettings({
        officeAddress: comp.office_address || localStorage.getItem(`office_address_${licenseCode}`) || 'Gedung i-rekap, Jl. Jend. Sudirman Kav. 21, Jakarta Selatan 12920',
        officeLat: comp.office_lat || localStorage.getItem(`office_lat_${licenseCode}`) || '-6.200000',
        officeLng: comp.office_lng || localStorage.getItem(`office_lng_${licenseCode}`) || '106.816666',
        radiusMeters: comp.radius_meters || localStorage.getItem(`radius_meters_${licenseCode}`) || '50',
        latenessTolerance: comp.lateness_tolerance || localStorage.getItem(`lateness_tolerance_${licenseCode}`) || '15'
      });

      setNetworkSettings({
        ipAddresses: comp.network_ips || localStorage.getItem(`network_ips_${licenseCode}`) || '192.168.1.100',
        requireIp: comp.require_ip !== null ? comp.require_ip : (localStorage.getItem(`network_require_${licenseCode}`) === 'true')
      });

      setPayrollSettings({
        lateDeductionType: comp.late_deduction_type || localStorage.getItem(`payroll_late_type_${licenseCode}`) || 'proportional',
        lateDeductionAmount: comp.late_deduction_amount || localStorage.getItem(`payroll_late_amount_${licenseCode}`) || '0'
      });

      // Terapkan tema dari Supabase jika ada
      if (comp.theme_primary) {
        document.documentElement.style.setProperty('--primary-color', comp.theme_primary);
        document.documentElement.style.setProperty('--secondary-color', comp.theme_secondary);
      }
      if (comp.theme_font) document.documentElement.style.setProperty('--font-family', comp.theme_font);
      if (comp.theme_bg) {
        document.body.className = ''; 
        document.body.classList.add(comp.theme_bg);
      }
    }
  };

  const updateSupabase = async (payload) => {
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode || licenseCode.startsWith('DEMO')) return true; // skip untuk demo
    const { error } = await supabase.from('companies').update(payload).eq('license_code', licenseCode);
    if (error) {
      console.error(error);
      alert('Gagal sinkronisasi ke cloud: ' + error.message);
      return false;
    }
    return true;
  };

  const handleSaveLocation = async () => {
    let licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return alert("Sesi tidak valid!");

    // Simpan ke Supabase terlebih dahulu
    const success = await updateSupabase({
      office_address: locationSettings.officeAddress,
      office_lat: locationSettings.officeLat,
      office_lng: locationSettings.officeLng,
      radius_meters: locationSettings.radiusMeters,
      lateness_tolerance: locationSettings.latenessTolerance
    });

    if (success) {
      // Hanya simpan di LocalStorage jika berhasil di Cloud
      localStorage.setItem(`office_address_${licenseCode}`, locationSettings.officeAddress);
      localStorage.setItem(`office_lat_${licenseCode}`, locationSettings.officeLat);
      localStorage.setItem(`office_lng_${licenseCode}`, locationSettings.officeLng);
      localStorage.setItem(`radius_meters_${licenseCode}`, locationSettings.radiusMeters);
      localStorage.setItem(`lateness_tolerance_${licenseCode}`, locationSettings.latenessTolerance);
      
      window.dispatchEvent(new Event('locationSettingsUpdated'));
      alert("✅ Pengaturan Lokasi berhasil disimpan dan disinkronkan ke seluruh perangkat!");
    }
  };

  const handleSaveNetwork = async () => {
    let licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return alert("Sesi tidak valid!");
    
    const success = await updateSupabase({
      network_ips: networkSettings.ipAddresses,
      require_ip: networkSettings.requireIp
    });

    if (success) {
      localStorage.setItem(`network_ips_${licenseCode}`, networkSettings.ipAddresses);
      localStorage.setItem(`network_require_${licenseCode}`, networkSettings.requireIp);
      alert("✅ Pengaturan Jaringan berhasil disinkronkan!");
    }
  };

  const handleSavePayroll = async () => {
    let licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return alert("Sesi tidak valid!");

    const success = await updateSupabase({
      late_deduction_type: payrollSettings.lateDeductionType,
      late_deduction_amount: payrollSettings.lateDeductionAmount
    });

    if (success) {
      localStorage.setItem(`payroll_late_type_${licenseCode}`, payrollSettings.lateDeductionType);
      localStorage.setItem(`payroll_late_amount_${licenseCode}`, payrollSettings.lateDeductionAmount);
      alert("✅ Pengaturan Penggajian berhasil disinkronkan!");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setCompanyProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Maksimal 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setCompanyProfile(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const success = await updateSupabase({
      logo_url: companyProfile.logo,
      name: companyProfile.name,
      hr_email: companyProfile.hrEmail
    });

    if (success) {
      localStorage.setItem('company-logo', companyProfile.logo);
      localStorage.setItem('company-name', companyProfile.name);
      localStorage.setItem('company-hr-email', companyProfile.hrEmail);
      window.dispatchEvent(new Event('profileUpdated'));
      alert("✅ Profil perusahaan berhasil disinkronkan!");
    }
  };

  const handleBackupData = () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `irekap_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Gagal melakukan backup data: " + error.message);
    }
  };

  const restoreFileRef = useRef(null);
  const handleRestoreData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (window.confirm("Peringatan: Mengembalikan data (Restore) akan menimpa semua data yang ada saat ini. Anda yakin ingin melanjutkan?")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          localStorage.clear();
          Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
          });

          // Upload restored settings to Supabase
          const licenseCode = localStorage.getItem('valid-license');
          if (licenseCode && !licenseCode.startsWith('DEMO')) {
            await supabase.from('companies').update({
              logo_url: data['company-logo'] || null,
              name: data['company-name'] || null,
              hr_email: data['company-hr-email'] || null,
              office_address: data[`office_address_${licenseCode}`] || null,
              office_lat: data[`office_lat_${licenseCode}`] || null,
              office_lng: data[`office_lng_${licenseCode}`] || null,
              radius_meters: data[`radius_meters_${licenseCode}`] || null,
              lateness_tolerance: data[`lateness_tolerance_${licenseCode}`] || null,
              network_ips: data[`network_ips_${licenseCode}`] || null,
              require_ip: data[`network_require_${licenseCode}`] === 'true',
              late_deduction_type: data[`payroll_late_type_${licenseCode}`] || null,
              late_deduction_amount: data[`payroll_late_amount_${licenseCode}`] || null,
              theme_primary: data['theme-primary'] || null,
              theme_secondary: data['theme-secondary'] || null,
              theme_font: data['theme-font'] || null,
              theme_bg: data['theme-bg'] || null
            }).eq('license_code', licenseCode);
          }

          alert("✅ Data berhasil dipulihkan dan disinkronkan ke Cloud! Aplikasi akan dimuat ulang.");
          window.location.reload();
        } catch (error) {
          alert("Format file tidak valid atau rusak!");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm("⚠️ PERINGATAN FATAL: Anda akan menghapus SEMUA data lokal. Lanjutkan?")) {
      const confirmText = window.prompt("Ketik 'HAPUS' untuk mengonfirmasi:");
      if (confirmText === 'HAPUS') {
        localStorage.clear();
        alert("Semua data lokal telah dihapus.");
        window.location.href = '/login';
      }
    }
  };

  const changeTheme = (primary, secondary) => {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    localStorage.setItem('theme-primary', primary);
    localStorage.setItem('theme-secondary', secondary);
  };

  const changeFont = (fontFamily) => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
    localStorage.setItem('theme-font', fontFamily);
  };

  const changeBackground = (bgClass) => {
    document.body.className = ''; 
    if (bgClass) document.body.classList.add(bgClass);
    localStorage.setItem('theme-bg', bgClass || '');
  };

  const handleSaveTheme = async () => {
    const success = await updateSupabase({
      theme_primary: localStorage.getItem('theme-primary'),
      theme_secondary: localStorage.getItem('theme-secondary'),
      theme_font: localStorage.getItem('theme-font'),
      theme_bg: localStorage.getItem('theme-bg')
    });

    if (success) {
      alert("✅ Personalisasi UI/UX berhasil disimpan dan disinkronkan ke seluruh perangkat!");
    }
  };

  return (
    <div className="settings-container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pengaturan Sistem</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Kelola preferensi aplikasi, lokasi absensi, dan personalisasi antarmuka.</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Menu for Settings */}
        <div className="settings-sidebar glass-panel">
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'lokasi' ? 'active' : ''}`}
              onClick={() => setActiveTab('lokasi')}
            >
              <div className="icon-box"><MapPin size={18} /></div>
              <span>Lokasi & Aturan Absen</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'jaringan' ? 'active' : ''}`}
              onClick={() => setActiveTab('jaringan')}
            >
              <div className="icon-box"><Wifi size={18} /></div>
              <span>Jaringan (IP)</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'tema' ? 'active' : ''}`}
              onClick={() => setActiveTab('tema')}
            >
              <div className="icon-box"><Palette size={18} /></div>
              <span>Personalisasi UI/UX</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'perusahaan' ? 'active' : ''}`}
              onClick={() => setActiveTab('perusahaan')}
            >
              <div className="icon-box"><Building size={18} /></div>
              <span>Profil Perusahaan</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'penggajian' ? 'active' : ''}`}
              onClick={() => setActiveTab('penggajian')}
            >
              <div className="icon-box"><Coins size={18} /></div>
              <span>Penggajian & Potongan</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'notifikasi' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifikasi')}
            >
              <div className="icon-box"><Bell size={18} /></div>
              <span>Notifikasi</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <div className="icon-box"><Database size={18} /></div>
              <span>Manajemen Data</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          
          {/* LOKASI TAB */}
          {activeTab === 'lokasi' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Pengaturan Lokasi & Aturan Absensi</h3>
                <p>Tentukan titik kordinat kantor pusat untuk membatasi radius absensi karyawan serta atur toleransi keterlambatan.</p>
              </div>
              
              <div className="settings-body">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Alamat Lengkap Kantor</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    value={locationSettings.officeAddress}
                    onChange={(e) => setLocationSettings({...locationSettings, officeAddress: e.target.value})}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Latitude Kantor</label>
                    <div className="input-with-icon">
                      <Globe size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={locationSettings.officeLat}
                        onChange={(e) => setLocationSettings({...locationSettings, officeLat: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude Kantor</label>
                    <div className="input-with-icon">
                      <Globe size={18} className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={locationSettings.officeLng}
                        onChange={(e) => setLocationSettings({...locationSettings, officeLng: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Radius Toleransi Maksimal (Meter)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="range" 
                      min="10" max="500" 
                      value={locationSettings.radiusMeters} 
                      onChange={(e) => setLocationSettings({...locationSettings, radiusMeters: e.target.value})}
                      className="range-slider" style={{ flex: 1 }} 
                    />
                    <div className="range-value">{locationSettings.radiusMeters} m</div>
                  </div>
                  <p className="helper-text">Karyawan tidak bisa absen jika berada di luar radius ini dari titik kordinat.</p>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Toleransi Keterlambatan (Menit)</label>
                  <div className="input-with-icon">
                    <Globe size={18} className="input-icon" style={{ opacity: 0 }} />
                    <input 
                      type="number" 
                      className="form-input" 
                      value={locationSettings.latenessTolerance}
                      onChange={(e) => setLocationSettings({...locationSettings, latenessTolerance: e.target.value})}
                    />
                  </div>
                  <p className="helper-text">Batas waktu (dalam menit) setelah jam masuk shift sebelum dianggap terlambat.</p>
                </div>
              </div>
              
              <div className="settings-footer">
                <button className="btn-primary" onClick={handleSaveLocation}>Simpan Pengaturan Lokasi</button>
              </div>
            </div>
          )}

          {/* JARINGAN TAB */}
          {activeTab === 'jaringan' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Pengaturan Jaringan (IP Whitelist)</h3>
                <p>Keamanan ekstra: Batasi absensi hanya melalui jaringan internet WiFi kantor.</p>
              </div>
              
              <div className="settings-body">
                <div className="form-group">
                  <label className="form-label">IP Address Publik Kantor</label>
                  <div className="input-with-icon">
                    <Wifi size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={networkSettings.ipAddresses} 
                      onChange={(e) => setNetworkSettings({...networkSettings, ipAddresses: e.target.value})}
                    />
                  </div>
                  <p className="helper-text">Pisahkan dengan koma jika Anda memiliki lebih dari satu koneksi internet publik.</p>
                </div>
                
                <div className="toggle-switch-container" style={{ marginTop: '2rem' }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={networkSettings.requireIp}
                      onChange={(e) => setNetworkSettings({...networkSettings, requireIp: e.target.checked})}
                    />
                    <span className="slider round"></span>
                  </label>
                  <div className="toggle-label">
                    <strong>Wajibkan Koneksi IP Kantor</strong>
                    <p>Jika diaktifkan, karyawan tidak bisa absen menggunakan paket data pribadi.</p>
                  </div>
                </div>
              </div>

              <div className="settings-footer">
                <button className="btn-primary" onClick={handleSaveNetwork}>Simpan Pengaturan Jaringan</button>
              </div>
            </div>
          )}

          {/* TEMA & PERSONALISASI TAB */}
          {activeTab === 'tema' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Personalisasi UI/UX (White-Label)</h3>
                <p>Ubah tampilan aplikasi ini agar mencerminkan identitas merek (Brand) perusahaan Anda secara eksklusif.</p>
              </div>
              
              <div className="settings-body">
                <div className="theme-section">
                  <h4>1. Preset Tema Warna Utama</h4>
                  <div className="color-presets">
                    <button className="color-preset-btn" onClick={() => changeTheme('#0062ff', '#ff9500')} title="Default (Blue & Orange)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #0062ff 50%, #ff9500 50%)' }}></div>
                      <span>Blue & Orange</span>
                    </button>
                    <button className="color-preset-btn" onClick={() => changeTheme('#0ea5e9', '#3b82f6')} title="Ocean (Cyan & Blue)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #0ea5e9 50%, #3b82f6 50%)' }}></div>
                      <span>Ocean Breeze</span>
                    </button>
                    <button className="color-preset-btn" onClick={() => changeTheme('#8b5cf6', '#ec4899')} title="Berry (Purple & Pink)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #8b5cf6 50%, #ec4899 50%)' }}></div>
                      <span>Berry Smooth</span>
                    </button>
                    <button className="color-preset-btn" onClick={() => changeTheme('#10b981', '#f59e0b')} title="Forest (Emerald & Amber)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #10b981 50%, #f59e0b 50%)' }}></div>
                      <span>Forest Green</span>
                    </button>
                    <button className="color-preset-btn" onClick={() => changeTheme('#0f172a', '#64748b')} title="Monochrome (Black & Slate)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #0f172a 50%, #64748b 50%)' }}></div>
                      <span>Monochrome</span>
                    </button>
                    <button className="color-preset-btn" onClick={() => changeTheme('#1c3c3c', '#a7ea50')} title="Neo Mint (Dark Slate & Lime)">
                      <div className="color-circle" style={{ background: 'linear-gradient(135deg, #1c3c3c 50%, #a7ea50 50%)' }}></div>
                      <span>Neo Mint</span>
                    </button>
                  </div>
                </div>

                <hr className="divider" />

                <div className="theme-section">
                  <h4>2. Latar Belakang (Background)</h4>
                  <div className="font-presets" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    <button className="font-preset-btn" onClick={() => changeBackground('')}>
                      <div style={{ width: '100%', height: '40px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}></div>
                      <span>Soft White</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-aurora')}>
                      <div style={{ width: '100%', height: '40px', background: 'linear-gradient(-45deg, #f0f4ff, #e0e7ff, #fdf4ff, #fff7ed)', borderRadius: '4px' }}></div>
                      <span>Aurora (Animasi)</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-midnight')}>
                      <div style={{ width: '100%', height: '40px', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: '4px' }}></div>
                      <span>Midnight Dark</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-ocean')}>
                      <div style={{ width: '100%', height: '40px', background: 'linear-gradient(135deg, #082f49 0%, #0c4a6e 100%)', borderRadius: '4px' }}></div>
                      <span>Deep Ocean</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-cyber')}>
                      <div style={{ width: '100%', height: '40px', background: 'linear-gradient(-45deg, #2e0854, #0b2e59, #4a044e)', borderRadius: '4px' }}></div>
                      <span>Cyber Neon</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-luxury')}>
                      <div style={{ width: '100%', height: '40px', background: 'radial-gradient(circle at top right, #3f2b00, #000000 40%)', borderRadius: '4px' }}></div>
                      <span>Luxury Gold</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-metallic')}>
                      <div style={{ width: '100%', height: '40px', background: 'linear-gradient(-45deg, #475569, #cbd5e1, #334155)', borderRadius: '4px' }}></div>
                      <span>Titanium Metallic</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-obsidian')}>
                      <div style={{ width: '100%', height: '40px', background: '#050505', borderRadius: '4px', border: '1px solid #333' }}></div>
                      <span>Pitch Black</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeBackground('bg-neo')}>
                      <div style={{ width: '100%', height: '40px', background: '#1c3c3c', borderRadius: '4px' }}></div>
                      <span>Neo Slate</span>
                    </button>
                  </div>
                </div>

                <hr className="divider" />

                <div className="theme-section">
                  <h4>3. Tipografi (Jenis Font)</h4>
                  <div className="font-presets">
                    <button className="font-preset-btn" onClick={() => changeFont("'Outfit', sans-serif")}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: '600' }}>Aa</span>
                      <span>Outfit (Modern)</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeFont("'Inter', sans-serif")}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.5rem', fontWeight: '600' }}>Aa</span>
                      <span>Inter (Clean)</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeFont("'Roboto', sans-serif")}>
                      <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.5rem', fontWeight: '600' }}>Aa</span>
                      <span>Roboto (Classic)</span>
                    </button>
                    <button className="font-preset-btn" onClick={() => changeFont("'Playfair Display', serif")}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '600' }}>Aa</span>
                      <span>Playfair (Elegant)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-footer">
                <button className="btn-primary" onClick={handleSaveTheme}>Simpan Personalisasi</button>
              </div>
            </div>
          )}

          {/* PERUSAHAAN TAB (Placeholder) */}
          {activeTab === 'penggajian' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3><Coins size={20} style={{ marginRight: '10px' }} /> Pengaturan Penggajian & Potongan</h3>
                <p>Atur bagaimana sistem menghitung denda keterlambatan karyawan.</p>
              </div>
              <div className="settings-body">
                <div className="form-group">
                  <label>Metode Potongan Keterlambatan</label>
                  <select 
                    className="form-input"
                    value={payrollSettings.lateDeductionType}
                    onChange={(e) => setPayrollSettings({...payrollSettings, lateDeductionType: e.target.value})}
                  >
                    <option value="proportional">Proporsional (Dihitung per menit dari Gaji Harian)</option>
                    <option value="flat_minute">Denda Tetap per Menit Keterlambatan</option>
                    <option value="flat_incident">Denda Tetap per Kejadian (Sekali Telat)</option>
                  </select>
                  <div className="helper-text">
                    Tentukan apakah karyawan dipotong sesuai harga per menit waktu kerjanya, atau nominal denda tetap (flat).
                  </div>
                </div>

                {payrollSettings.lateDeductionType !== 'proportional' && (
                  <div className="form-group">
                    <label>Nominal Denda (Rp)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Contoh: 10000"
                      value={payrollSettings.lateDeductionAmount}
                      onChange={(e) => setPayrollSettings({...payrollSettings, lateDeductionAmount: e.target.value})}
                    />
                    <div className="helper-text">
                      {payrollSettings.lateDeductionType === 'flat_minute' 
                        ? 'Nominal ini akan dikalikan dengan total menit keterlambatan (Misal: Telat 10 menit x Rp 10.000 = Rp 100.000).'
                        : 'Nominal ini akan dipotong setiap kali karyawan tercatat terlambat, berapapun lama keterlambatannya (Misal: Rp 50.000/hari telat).'}
                    </div>
                  </div>
                )}
              </div>
              <div className="settings-footer">
                <button className="btn-primary" onClick={handleSavePayroll}>
                  <Check size={18} style={{ marginRight: '8px' }} />
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          )}

          {activeTab === 'perusahaan' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Profil Perusahaan</h3>
                <p>Informasi dasar mengenai perusahaan Anda.</p>
              </div>
              <div className="settings-body">
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Logo Perusahaan</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={companyProfile.logo} alt="Company Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoUpload}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => fileInputRef.current.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                      >
                        <Upload size={16} /> Unggah Logo Baru
                      </button>
                      <p className="helper-text" style={{ margin: 0 }}>Format yang didukung: PNG, JPG, SVG (Maks. 2MB)</p>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nama Perusahaan</label>
                  <input type="text" className="form-input" name="name" value={companyProfile.name} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email HRD</label>
                  <input type="email" className="form-input" name="hrEmail" value={companyProfile.hrEmail} onChange={handleProfileChange} />
                </div>

                <hr className="divider" style={{ margin: '2rem 0', borderTop: '1px solid #e2e8f0' }} />
                
                <div className="form-group">
                  <label className="form-label">Link Instalasi Karyawan (Tanpa Perlu Ketik Lisensi)</label>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    Bagikan link ini ke grup WhatsApp karyawan. Karyawan yang membuka link ini bisa langsung Install Aplikasi (Add to Home Screen) tanpa harus memasukkan Kode Lisensi manual.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      readOnly 
                      value={`${window.location.origin}/#/login?lic=${localStorage.getItem('valid-license') || ''}`} 
                      style={{ background: '#f8fafc', color: '#0f172a', flex: 1 }}
                    />
                    <button 
                      type="button"
                      className="btn-primary" 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/#/login?lic=${localStorage.getItem('valid-license') || ''}`);
                        alert('Link berhasil disalin! Silakan paste dan bagikan ke grup WhatsApp karyawan.');
                      }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
              <div className="settings-footer">
                <button className="btn-primary" onClick={handleSaveProfile}>Simpan Profil</button>
              </div>
            </div>
          )}

          {/* NOTIFIKASI TAB (Placeholder) */}
          {activeTab === 'notifikasi' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Preferensi Notifikasi</h3>
                <p>Atur bagaimana sistem mengirimkan pemberitahuan kepada HRD.</p>
              </div>
              <div className="settings-body">
                 <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                  <div className="toggle-label">
                    <strong>Email Harian (Rekap Absen)</strong>
                    <p>Kirim rekap absensi setiap jam 18:00 ke email HRD.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAJEMEN DATA TAB */}
          {activeTab === 'data' && (
            <div className="settings-card glass-panel fade-in">
              <div className="settings-header">
                <h3>Manajemen Data Sistem</h3>
                <p>Cadangkan (Backup), pulihkan (Restore), atau hapus semua data di dalam aplikasi i-Rekap.</p>
              </div>
              
              <div className="settings-body">
                {/* Backup Section */}
                <div className="data-action-card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.75rem', borderRadius: '50%' }}>
                      <Download size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>Backup Data Lokal</h4>
                      <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.9rem' }}>Unduh semua data karyawan, absensi, kasbon, jadwal shift, dan pengaturan ke dalam satu file aman (.json) di perangkat ini.</p>
                      <button className="btn-primary" onClick={handleBackupData} style={{ background: '#2563eb', border: 'none', boxShadow: 'none' }}>Mulai Backup Data</button>
                    </div>
                  </div>
                </div>

                {/* Restore Section */}
                <div className="data-action-card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '50%' }}>
                      <RefreshCw size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>Restore Data (Pulihkan)</h4>
                      <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.9rem' }}>Unggah file backup (.json) yang pernah Anda simpan sebelumnya untuk memulihkan seluruh data aplikasi.</p>
                      <input 
                        type="file" 
                        ref={restoreFileRef} 
                        style={{ display: 'none' }} 
                        accept=".json"
                        onChange={handleRestoreData}
                      />
                      <button className="btn-primary" onClick={() => restoreFileRef.current.click()} style={{ background: '#16a34a', border: 'none', boxShadow: 'none' }}>Pilih File Backup</button>
                    </div>
                  </div>
                </div>

                {/* Factory Reset Section */}
                <div className="data-action-card" style={{ padding: '1.5rem', border: '1px solid #fee2e2', borderRadius: '12px', background: '#fff1f2' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: '#fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '50%' }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#7f1d1d' }}>Factory Reset (Hapus Semua)</h4>
                      <p style={{ margin: '0 0 1rem 0', color: '#991b1b', fontSize: '0.9rem' }}>Hapus bersih seluruh data aplikasi secara permanen. Aplikasi akan kembali seperti baru di-install. Gunakan dengan sangat hati-hati!</p>
                      <button className="btn-primary" onClick={handleResetData} style={{ background: '#dc2626', border: 'none', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>Hapus Semua Data</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
