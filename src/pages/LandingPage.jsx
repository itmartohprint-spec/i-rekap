import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, CheckCircle, MapPin, Camera, Wifi, Shield, Clock, FileText } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo.png" alt="i-rekap logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <nav className="landing-nav">
          <button onClick={() => scrollToSection('fitur')} className="nav-link-btn">Fitur</button>
          <button onClick={() => scrollToSection('harga')} className="nav-link-btn">Harga</button>
          <button className="btn-secondary" onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem' }}>
            Masuk / Login
          </button>
        </nav>
      </header>

      <div className="hero-wrapper">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Solusi Absensi <span>Modern & Cerdas</span><br/>untuk Perusahaan Anda</h1>
            <p className="hero-subtitle">
              Kelola kehadiran karyawan dengan mudah melalui deteksi Lokasi (GPS), jaringan IP, dan foto Selfie dalam satu platform cloud yang terintegrasi.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Mulai Berlangganan (Gratis 14 Hari)</button>
            </div>
          </div>
          <div className="hero-image-container">
            <img src="/maskot.png" alt="i-Rekap Mascot" className="hero-mascot" />
          </div>
        </section>
      </div>

      <section id="fitur" className="features-section">
        <h2 className="section-title">Fitur Unggulan Kami</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><MapPin size={32} /></div>
            <h3>Validasi Lokasi (GPS)</h3>
            <p>Pastikan karyawan berada di lokasi yang tepat saat absen dengan deteksi koordinat GPS presisi.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Camera size={32} /></div>
            <h3>Verifikasi Selfie</h3>
            <p>Bukti foto langsung dari kamera untuk menghindari kecurangan dan penitipan absen.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Wifi size={32} /></div>
            <h3>Pelacakan IP Address</h3>
            <p>Sistem memvalidasi jaringan internet (IP) yang digunakan karyawan untuk keamanan ganda.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Clock size={32} /></div>
            <h3>Manajemen Lembur & Cuti</h3>
            <p>Proses pengajuan cuti, izin, dan lembur lebih mudah dengan alur persetujuan otomatis.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Shield size={32} /></div>
            <h3>Cloud Database Aman</h3>
            <p>Seluruh data karyawan dan log absensi tersimpan aman di server cloud terenkripsi penuh.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FileText size={32} /></div>
            <h3>Laporan Otomatis</h3>
            <p>Ekspor laporan absensi lengkap ke format PDF atau Excel hanya dalam sekali klik.</p>
          </div>
        </div>
      </section>

      <section id="harga" className="pricing-section">
        <h2 className="pricing-title">Pilih Paket Lisensi Anda</h2>
        <div className="pricing-cards">
          
          <div className="pricing-card">
            <h3 className="plan-name">Basic</h3>
            <div className="plan-price">Rp 499rb<span>/bulan</span></div>
            <ul className="plan-features">
              <li><CheckCircle size={16} color="var(--success-color)"/> Hingga 50 Karyawan</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Validasi Lokasi (GPS)</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Laporan Standar</li>
            </ul>
            <button className="btn-secondary plan-btn" onClick={() => navigate('/login')}>Pilih Basic</button>
          </div>

          <div className="pricing-card popular">
            <div className="popular-badge">Paling Diminati</div>
            <h3 className="plan-name">Pro</h3>
            <div className="plan-price">Rp 999rb<span>/bulan</span></div>
            <ul className="plan-features">
              <li><CheckCircle size={16} color="var(--success-color)"/> Hingga 200 Karyawan</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Validasi Lokasi & IP</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Verifikasi Selfie</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Ekspor PDF & Excel</li>
            </ul>
            <button className="btn-primary plan-btn" onClick={() => navigate('/login')}>Pilih Pro</button>
          </div>

          <div className="pricing-card">
            <h3 className="plan-name">Enterprise</h3>
            <div className="plan-price">Hubungi Kami</div>
            <ul className="plan-features">
              <li><CheckCircle size={16} color="var(--success-color)"/> Karyawan Tak Terbatas</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Semua Fitur Pro</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Dedicated Server</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> API Integration</li>
            </ul>
            <button className="btn-secondary plan-btn" onClick={() => navigate('/login')}>Hubungi Sales</button>
          </div>

        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 i-rekap SaaS. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
