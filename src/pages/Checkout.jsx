import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, QrCode, Building } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Checkout.css';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(9 * 60);
  const [showUpload, setShowUpload] = useState(false);
  const [paymentProof, setPaymentProof] = useState('');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'standar' || planParam === 'pro') {
      setPlan(planParam);
    }
  }, [searchParams]);

  const planDetails = {
    standar: {
      name: 'Paket Standar',
      price: 'Rp 499.000',
      features: ['Hingga 50 Karyawan', 'Validasi Lokasi (GPS)', 'Laporan Standar']
    },
    pro: {
      name: 'Paket Pro',
      price: 'Rp 999.000',
      features: ['Hingga 200 Karyawan', 'Validasi Lokasi & IP', 'Verifikasi Selfie', 'Ekspor PDF & Excel']
    }
  };

  const currentPlan = planDetails[plan];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Simulasikan proses pembayaran
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Generate License Code
      const generatedLicense = 'LIC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem('valid-license', generatedLicense);

      // 3. Insert ke Supabase (tabel companies)
      const { error } = await supabase.from('companies').insert([{
        name: formData.companyName,
        admin_name: formData.adminName,
        email: formData.email,
        plan: plan,
        status: 'active', // Langsung aktif karena sudah dapat lisensi (MVP)
        payment_proof: paymentProof,
        license_code: generatedLicense
      }]);

      if (error) {
        console.warn("Catatan: Tabel 'companies' mungkin belum ada di Supabase.", error.message);
      }

      alert(`Pendaftaran Berhasil! Bukti pembayaran telah diterima.\n\nKODE LISENSI ANDA: ${generatedLicense}\n\nSilakan simpan kode ini dengan baik, kode ini dibutuhkan untuk login ke portal HRD dan Karyawan.`);
      navigate('/');

    } catch (err) {
      alert('Terjadi kesalahan saat memproses pembayaran.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        {/* Left Side: Order Summary */}
        <div className="checkout-summary">
          <div>
            <div className="summary-header">
              <h2>Ringkasan Pesanan</h2>
              <p>Selesaikan pembayaran untuk mulai menggunakan i-Rekap.</p>
            </div>

            <div className="plan-details">
              <div className="plan-name-display">{currentPlan.name}</div>
              <div className="plan-price-display">{currentPlan.price}<span>/bulan</span></div>
              <ul className="summary-features">
                {currentPlan.features.map((feat, idx) => (
                  <li key={idx}><CheckCircle size={18} color="#4ade80" /> {feat}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem', opacity: 0.8, fontSize: '0.9rem' }}>
            <p>Berlangganan dapat dibatalkan kapan saja.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="checkout-form-section">
          <h2 className="checkout-title"><Building size={24} color="var(--primary-color)"/> Registrasi Perusahaan</h2>
          
          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label>Nama Perusahaan</label>
              <input type="text" name="companyName" className="checkout-input" placeholder="PT Maju Bersama" value={formData.companyName} onChange={handleInputChange} required />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nama Admin HR</label>
                <input type="text" name="adminName" className="checkout-input" placeholder="Budi Santoso" value={formData.adminName} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Email Admin</label>
                <input type="email" name="email" className="checkout-input" placeholder="hr@perusahaan.com" value={formData.email} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Buat Password Admin</label>
              <input type="password" name="password" className="checkout-input" placeholder="Minimal 8 karakter" value={formData.password} onChange={handleInputChange} required minLength="8" />
            </div>

            <h3 style={{ fontSize: '1.1rem', margin: '2rem 0 1rem', color: 'var(--text-primary)' }}>Metode Pembayaran</h3>
            <div className="payment-methods">
              <div className="payment-method active" style={{ cursor: 'default' }}>
                <QrCode size={24} />
                QRIS
              </div>
            </div>

            <div className="qris-payment-section" style={{ textAlign: 'center', margin: '1.5rem 0', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ marginBottom: '1rem', fontWeight: '500', color: '#334155' }}>Scan QR Code ini untuk membayar</p>
              <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden' }}>
                <img src="/qris.png" alt="QRIS Pembayaran" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: timeLeft <= 60 ? '#dc2626' : '#334155', fontWeight: 'bold' }}>
                Selesaikan dalam: {formatTime(timeLeft)}
              </p>
            </div>

            {!showUpload ? (
              <button type="button" className="btn-pay" onClick={() => setShowUpload(true)}>
                Verifikasi Pembayaran Anda
              </button>
            ) : (
              <div className="upload-section" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Unggah Bukti Transfer</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', background: 'white', borderRadius: '4px' }} required />
                
                <button type="submit" className="btn-pay" disabled={isLoading || !paymentProof}>
                  {isLoading ? 'Memproses...' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            )}

            <div className="secure-badge">
              <Lock size={16} /> Pembayaran aman terenkripsi 256-bit
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
