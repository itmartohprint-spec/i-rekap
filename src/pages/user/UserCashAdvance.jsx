import React, { useState } from 'react';
import { Wallet, Banknote, Send } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UserCashAdvance = () => {
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    repaymentMethod: 'Sekali', // Default option
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleAmountChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, amount: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.amount) < 50000) {
      alert('Minimal kasbon adalah Rp 50.000');
      return;
    }

    const licenseCode = localStorage.getItem('valid-license');
    const employeeId = localStorage.getItem('user-id');

    if (!licenseCode || !employeeId) {
      alert("Sesi login tidak valid. Silakan login ulang.");
      return;
    }

    const finalReason = `${formData.reason} (Metode: ${formData.repaymentMethod})`;

    const { error } = await supabase.from('cash_advances').insert([{
      license_code: licenseCode,
      employee_id: employeeId,
      amount: parseInt(formData.amount),
      reason: finalReason,
      status: 'pending'
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    } else {
      alert(`Pengajuan kasbon sebesar ${formatRupiah(formData.amount)} berhasil dikirim!`);
      setFormData({ amount: '', reason: '', repaymentMethod: 'Sekali' });
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#e0e7ff', padding: '0.8rem', borderRadius: '14px' }}>
          <Wallet size={28} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>Pengajuan Kasbon</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Limit tersedia: <strong>Rp 2.000.000</strong></p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Nominal Kasbon (Rp)</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>Rp</div>
            <input 
              type="text" 
              required
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="Contoh: 500000"
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>
          {formData.amount && (
            <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '0.2rem', fontWeight: 500 }}>
              Terbilang: {formatRupiah(formData.amount)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Keperluan / Alasan</label>
          <textarea 
            rows="3"
            required
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Tuliskan keperluan Anda..."
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Metode Pelunasan / Potong Gaji</label>
          <select 
            required
            value={formData.repaymentMethod}
            onChange={(e) => setFormData({...formData, repaymentMethod: e.target.value})}
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem', color: '#0f172a' }}
          >
            <option value="Sekali">Potong Sekali (Gajian Berikutnya)</option>
            <option value="Cicil 2x">Cicil 2x (Selama 2 Bulan)</option>
            <option value="Cicil 3x">Cicil 3x (Selama 3 Bulan)</option>
          </select>
        </div>

        <button type="submit" style={{ 
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)', 
          color: 'white', 
          padding: '1.2rem', 
          borderRadius: '16px', 
          border: 'none', 
          fontSize: '1.1rem', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)'
        }}>
          <Banknote size={20} />
          Ajukan Kasbon
        </button>
      </form>
    </div>
  );
};

export default UserCashAdvance;
