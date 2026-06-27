import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, CheckCircle, MapPin, Camera, Wifi, Shield, Clock, FileText, DollarSign, CalendarRange, Users, Banknote, Star, Activity } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeMonitorTab, setActiveMonitorTab] = useState('beranda');

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
          <img src="/mascot_header.png" alt="Mascot" className="nav-mascot" />
          i-Rekap
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
              <button className="btn-primary" onClick={() => document.getElementById('harga')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Mulai Berlangganan (Gratis 14 Hari)</button>
            </div>
          </div>
          <div className="hero-image-container">
            <img src="/maskot.png" alt="i-Rekap Mascot" className="hero-mascot" />
          </div>
        </section>
      </div>

      <section id="fitur" className="features-section">
        <h2 className="section-title">Fitur Unggulan Kami</h2>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <Users size={28} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Fitur untuk Karyawan</h3>
          </div>
        </div>
        <div className="features-grid bento-layout" style={{ marginBottom: '5rem' }}>
          <div className="feature-card bento-large">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_k1.webp')} style={{ cursor: 'pointer' }}><img src="/feat_k1.webp" alt="Absensi Mobile" /></div>
            <div className="feature-content">
              <div className="feature-icon"><MapPin size={32} /></div>
              <h3>Absensi Mobile (GPS & Selfie)</h3>
              <p>Absen mudah dari HP dengan deteksi lokasi akurat (GPS) dan verifikasi wajah (Selfie) untuk menghindari penitipan absen.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_k2.webp')} style={{ cursor: 'pointer' }}><img src="/feat_k2.webp" alt="Pengajuan Cuti" /></div>
            <div className="feature-content">
              <div className="feature-icon"><CalendarRange size={32} /></div>
              <h3>Pengajuan Cuti & Izin</h3>
              <p>Ajukan cuti, izin, atau sakit langsung dari genggaman tanpa perlu mengisi form kertas lagi. Pantau status persetujuannya secara real-time.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_k3.webp')} style={{ cursor: 'pointer' }}><img src="/feat_k3.webp" alt="Pengajuan Kasbon" /></div>
            <div className="feature-content">
              <div className="feature-icon"><Banknote size={32} /></div>
              <h3>Pengajuan Kasbon (Cash Advance)</h3>
              <p>Fasilitas pengajuan pinjaman karyawan/kasbon dengan sistem pemotongan otomatis pada saat penggajian.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_k4.webp')} style={{ cursor: 'pointer' }}><img src="/feat_k4.webp" alt="Slip Gaji Digital" /></div>
            <div className="feature-content">
              <div className="feature-icon"><FileText size={32} /></div>
              <h3>Riwayat & Slip Gaji Digital</h3>
              <p>Pantau riwayat absensi harian dan unduh slip gaji bulanan secara mandiri dengan mudah dan aman.</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <Shield size={28} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Fitur untuk HR & Admin</h3>
          </div>
        </div>
        <div className="features-grid bento-layout">
          <div className="feature-card bento-large">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_a1.webp')} style={{ cursor: 'pointer' }}><img src="/feat_a1.webp" alt="Live Tracking" /></div>
            <div className="feature-content">
              <div className="feature-icon"><Wifi size={32} /></div>
              <h3>Live Tracking & Validasi IP</h3>
              <p>Pantau lokasi karyawan secara langsung dan validasi jaringan internet (IP Address) yang mereka gunakan saat absen.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_a2.webp')} style={{ cursor: 'pointer' }}><img src="/feat_a2.webp" alt="Manajemen Shift" /></div>
            <div className="feature-content">
              <div className="feature-icon"><Clock size={32} /></div>
              <h3>Manajemen Shift & Jadwal</h3>
              <p>Atur jadwal kerja fleksibel, shift bergulir, dan toleransi keterlambatan sesuai kebijakan perusahaan Anda.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_a3.webp')} style={{ cursor: 'pointer' }}><img src="/feat_a3.webp" alt="Approval System" /></div>
            <div className="feature-content">
              <div className="feature-icon"><CheckCircle size={32} /></div>
              <h3>Approval System 1-Klik</h3>
              <p>Setujui atau tolak pengajuan cuti, lembur, dan kasbon karyawan hanya dengan satu klik dari dashboard Anda.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-img-container" onClick={() => setSelectedImage('/feat_a4.webp')} style={{ cursor: 'pointer' }}><img src="/feat_a4.webp" alt="Payroll Otomatis" /></div>
            <div className="feature-content">
              <div className="feature-icon"><DollarSign size={32} /></div>
              <h3>Payroll & Ekspor Laporan Otomatis</h3>
              <p>Sistem rekap gaji otomatis berdasarkan kehadiran dan kasbon. Ekspor laporan ke PDF atau Excel dengan instan.</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '3rem auto 0 auto', textAlign: 'left', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <Activity size={28} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Fitur untuk Eksekutif & Pimpinan</h3>
          </div>
        </div>
        <div className="features-grid bento-layout">
          <div className="feature-card bento-large">
            <div className="live-monitor-mockup-container">
              <div className="live-monitor-mockup">
                <div className="lm-header">
                  <div className="lm-pill"><Activity size={12} /> Monitor Eksekutif</div>
                  <div className="lm-time">08.15.30</div>
                  <div className="lm-date">Sabtu, 27 Juni 2026</div>
                </div>
                {activeMonitorTab === 'beranda' && (
                  <div className="lm-grid">
                    <div className="lm-card">
                      <Users size={20} color="#60a5fa" />
                      <span>Total Karyawan</span>
                      <strong>24</strong>
                    </div>
                    <div className="lm-card">
                      <CheckCircle size={20} color="#34d399" />
                      <span>Hadir (Hari Ini)</span>
                      <strong>22</strong>
                    </div>
                    <div className="lm-card">
                      <Clock size={20} color="#fbbf24" />
                      <span>Terlambat</span>
                      <strong>2</strong>
                    </div>
                    <div className="lm-card">
                      <span style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 'bold' }}>X</span>
                      <span>Absen (Alpha)</span>
                      <strong>0</strong>
                    </div>
                  </div>
                )}
                {activeMonitorTab === 'peta' && (
                  <div style={{ height: '180px', background: '#1e293b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
                    <MapPin size={40} color="#60a5fa" />
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Peta GPS Karyawan Aktif Hari Ini</span>
                  </div>
                )}
                {activeMonitorTab === 'pengajuan' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '180px', justifyContent: 'center' }}>
                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.3rem', fontWeight: 'bold' }}>IZIN CUTI - Budi</div>
                      <div style={{ fontSize: '0.85rem', color: 'white', marginBottom: '0.8rem' }}>Cuti tahunan tgl 28 Juni</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ flex: 1, padding: '0.4rem', background: '#10b981', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Setujui</button>
                        <button style={{ flex: 1, padding: '0.4rem', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>Tolak</button>
                      </div>
                    </div>
                  </div>
                )}
                {activeMonitorTab === 'sidak' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '0.5rem', height: '180px', justifyContent: 'center' }}>
                    <Camera size={36} color="#f87171" />
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>Gunakan fitur ini untuk meminta foto Selfie + GPS seketika dari karyawan.</p>
                    <button style={{ width: '100%', padding: '0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>SIDAK MASSAL</button>
                  </div>
                )}
                
                <div className="lm-tabs">
                  <div className={`lm-tab ${activeMonitorTab === 'beranda' ? 'active' : ''}`} onClick={() => setActiveMonitorTab('beranda')} style={{ cursor: 'pointer' }}><Activity size={16}/>Beranda</div>
                  <div className={`lm-tab ${activeMonitorTab === 'peta' ? 'active' : ''}`} onClick={() => setActiveMonitorTab('peta')} style={{ cursor: 'pointer' }}><MapPin size={16}/>Peta</div>
                  <div className={`lm-tab ${activeMonitorTab === 'pengajuan' ? 'active' : ''}`} onClick={() => setActiveMonitorTab('pengajuan')} style={{ cursor: 'pointer' }}><FileText size={16}/>Pengajuan</div>
                  <div className={`lm-tab ${activeMonitorTab === 'sidak' ? 'active' : ''}`} onClick={() => setActiveMonitorTab('sidak')} style={{ cursor: 'pointer' }}><Camera size={16}/>Sidak</div>
                </div>
              </div>
            </div>
            <div className="feature-content" style={{ padding: '2rem' }}>
              <div className="feature-icon"><Activity size={32} /></div>
              <h3>Live Monitor Kehadiran (Eksekutif)</h3>
              <p>Dashboard khusus pimpinan untuk memantau kehadiran karyawan secara real-time. Dilengkapi fitur pantauan <strong>Peta GPS</strong>, persetujuan <strong>Pengajuan</strong> dalam satu klik, hingga fitur <strong>Sidak (Selfie Mendadak)</strong> langsung dari layar Anda.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="harga" className="pricing-section">
        <h2 className="pricing-title">Pilih Paket Lisensi Anda</h2>
        <div className="pricing-cards">
          
          <div className="pricing-card">
            <h3 className="plan-name">Demo</h3>
            <div className="plan-price">Gratis<span>/14 hari</span></div>
            <ul className="plan-features">
              <li><CheckCircle size={16} color="var(--success-color)"/> Coba Semua Fitur</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Maksimal 10 Karyawan</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Tanpa Kartu Kredit</li>
            </ul>
            <button className="btn-secondary plan-btn" onClick={() => navigate('/register-demo')}>Mulai Demo</button>
          </div>

          <div className="pricing-card">
            <h3 className="plan-name">Standar</h3>
            <div className="plan-price">Rp 499rb<span>/bulan</span></div>
            <ul className="plan-features">
              <li><CheckCircle size={16} color="var(--success-color)"/> Hingga 50 Karyawan</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Validasi Lokasi (GPS)</li>
              <li><CheckCircle size={16} color="var(--success-color)"/> Laporan Standar</li>
            </ul>
            <button className="btn-secondary plan-btn" onClick={() => navigate('/checkout?plan=standar')}>Pilih Standar</button>
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
            <button className="btn-primary plan-btn" onClick={() => navigate('/checkout?plan=pro')}>Pilih Pro</button>
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
            <button className="btn-secondary plan-btn" onClick={() => window.open('https://wa.me/6289628003344', '_blank')}>Hubungi Sales</button>
          </div>

        </div>
      </section>

      <section className="clients-section">
        <h2 className="section-title">Pelanggan Kami</h2>
        <div className="clients-grid">
          <div className="client-logo-wrapper">
            <img src="/logo-ass.jpg" alt="ASS (Anugrah Stainless Steel)" title="ASS (Anugrah Stainless Steel)" />
          </div>
          <div className="client-logo-wrapper">
            <img src="/logo-jskm.png" alt="PT. Jasa Service Komputer Mart" title="PT. Jasa Service Komputer Mart" />
          </div>
          <div className="client-logo-wrapper">
            <img src="/logo-rag.png" alt="RAG Indonesia" title="RAG Indonesia" />
          </div>
          <div className="client-logo-wrapper">
            <img src="/logo-pkl-jskm.png" alt="PKL JSKM" title="PKL JSKM" />
          </div>
          <div className="client-logo-wrapper empty">
            <span>(Menunggu Logo ke-5)</span>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <h2 className="section-title">Apa Kata Mereka?</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
            </div>
            <p className="testimonial-text">"Semenjak pakai i-Rekap, urusan absen karyawan jadi sangat praktis. Fitur deteksi lokasi dan selfie-nya sangat akurat, tidak ada lagi yang bisa titip absen!"</p>
            <div className="testimonial-author">
              <div className="author-avatar">A</div>
              <div>
                <h4>Ahmad Syarif</h4>
                <span>HR Manager, Retail</span>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="stars">
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
            </div>
            <p className="testimonial-text">"Sistem approval cuti dan kasbon dalam satu klik benar-benar menghemat waktu saya sebagai pemilik usaha. Tampilan aplikasinya juga sangat elegan dan mudah dipahami."</p>
            <div className="testimonial-author">
              <div className="author-avatar">B</div>
              <div>
                <h4>Budi Santoso</h4>
                <span>Business Owner</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
              <Star size={18} fill="#f59e0b" color="#f59e0b" />
            </div>
            <p className="testimonial-text">"Export laporan penggajian jadi hitungan detik. Dulu kami butuh berhari-hari untuk merekap absen dan lembur, sekarang semua otomatis. Sangat recommended!"</p>
            <div className="testimonial-author">
              <div className="author-avatar">C</div>
              <div>
                <h4>Citra Kirana</h4>
                <span>Finance & Admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 i-rekap SaaS. Hak Cipta Dilindungi.</p>
      </footer>

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="image-modal-close" onClick={() => setSelectedImage(null)}>&times;</span>
            <img src={selectedImage} alt="Feature enlarged" className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
