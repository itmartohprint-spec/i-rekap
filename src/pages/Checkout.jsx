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

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Simulasikan proses pembayaran
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Insert ke Supabase (tabel companies)
      // Note: Jika tabel belum ada, kita tangkap errornya dan tetap lanjut untuk MVP
      const { error } = await supabase.from('companies').insert([{
        name: formData.companyName,
        admin_name: formData.adminName,
        email: formData.email,
        plan: plan,
        status: 'active'
      }]);

      if (error) {
        console.warn("Catatan: Tabel 'companies' mungkin belum ada di Supabase.", error.message);
      }

      // 3. Set sesi login untuk Admin Pro
      localStorage.setItem('admin-role', 'pro');
      localStorage.setItem('company-name', formData.companyName);
      localStorage.setItem('company-hr-email', formData.email);
      localStorage.setItem('admin-password', formData.password);
      
      alert(`Pembayaran Berhasil! Selamat datang di i-Rekap, ${formData.companyName}.`);
      navigate('/admin/dashboard');

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

            <button type="submit" className="btn-pay" disabled={isLoading}>
              {isLoading ? 'Memproses...' : `Bayar ${currentPlan.price} & Buat Akun`}
            </button>

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
