import React, { useState, useEffect } from 'react';
import { Wallet, Banknote, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UserCashAdvance = () => {
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    repaymentMethod: 'Sekali',
  });
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    const employeeId = localStorage.getItem('user-id');
    
    if (licenseCode && employeeId) {
      const { data, error } = await supabase
        .from('cash_advances')
        .select('*')
        .eq('license_code', licenseCode)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
        
      if (data) setHistory(data);
    }
    setIsLoading(false);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleAmountChange = (e) => {
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
      alert("Terjadi kesalahan: " + error.message);
    } else {
      alert(`Pengajuan kasbon sebesar ${formatRupiah(formData.amount)} berhasil dikirim!`);
      setFormData({ amount: '', reason: '', repaymentMethod: 'Sekali' });
      fetchHistory();
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span style={{ padding: '0.3rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14}/> Disetujui</span>;
      case 'rejected': return <span style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={14}/> Ditolak</span>;
      case 'paid': return <span style={{ padding: '0.3rem 0.6rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14}/> Lunas</span>;
      default: return <span style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14}/> Menunggu</span>;
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#e0e7ff', padding: '0.8rem', borderRadius: '14px' }}>
          <Wallet size={28} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>Pengajuan Kasbon</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Limit tersedia: <strong>Rp 2.000.000</strong></p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
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

      <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 1rem 0', fontWeight: 700 }}>Riwayat Kasbon Saya</h2>
        
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', margin: 0 }}>Belum ada riwayat pengajuan kasbon.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item) => (
              <div key={item.id} style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{formatRupiah(item.amount)}</div>
                  {getStatusBadge(item.status)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Diajukan pada: {new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCashAdvance;
