import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UserLeave = () => {
  const [formData, setFormData] = useState({
    type: 'Tahunan',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [leaveQuota, setLeaveQuota] = useState(12);
  const [usedLeave, setUsedLeave] = useState(0);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotaAndHistory = async () => {
    setIsLoading(true);
    const employeeId = localStorage.getItem('user-id');
    const licenseCode = localStorage.getItem('valid-license');
    if (!employeeId || !licenseCode) return;

    // Fetch quota
    const { data: empData } = await supabase
      .from('employees')
      .select('leave_quota')
      .eq('id', employeeId)
      .eq('license_code', licenseCode)
      .single();
    
    if (empData && empData.leave_quota !== undefined) {
      setLeaveQuota(empData.leave_quota);
    }

    // Fetch all leave requests (for history)
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('license_code', licenseCode)
      .eq('type', 'cuti')
      .order('created_at', { ascending: false });

    if (leaveData) {
      setLeaveHistory(leaveData);
      
      let totalUsed = 0;
      leaveData.forEach(req => {
        // Only count 'Cuti Tahunan' that are not rejected
        if (req.reason && req.reason.includes('Cuti Tahunan') && req.status !== 'Ditolak' && req.status !== 'ditolak' && req.status !== 'rejected') {
          const start = new Date(req.start_date);
          const end = new Date(req.end_date);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            totalUsed += diffDays;
          }
        }
      });
      setUsedLeave(totalUsed);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuotaAndHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const employeeId = localStorage.getItem('user-id');
    const licenseCode = localStorage.getItem('valid-license');
    if (!employeeId || !licenseCode) {
      alert("Sesi login tidak valid.");
      return;
    }

    const finalReason = `[${formData.type === 'Tahunan' ? 'Cuti Tahunan' : 'Cuti Melahirkan'}] ${formData.reason}`;

    const { error } = await supabase.from('leave_requests').insert([{
      license_code: licenseCode,
      employee_id: employeeId,
      type: 'cuti',
      start_date: formData.startDate,
      end_date: formData.endDate,
      reason: finalReason,
      status: 'pending'
    }]);

    if (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } else {
      alert('Pengajuan cuti berhasil dikirim!');
      setFormData({ type: 'Tahunan', startDate: '', endDate: '', reason: '' });
      fetchQuotaAndHistory();
    }
  };

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'disetujui') {
      return <span style={{ padding: '0.3rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14}/> Disetujui</span>;
    }
    if (s === 'rejected' || s === 'ditolak') {
      return <span style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={14}/> Ditolak</span>;
    }
    return <span style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14}/> Menunggu</span>;
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>Pengajuan Cuti</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sisa Cuti Tahunan: <strong>{leaveQuota - usedLeave} Hari</strong></p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Jenis Cuti</label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem' }}
          >
            <option value="Tahunan">Cuti Tahunan</option>
            <option value="Melahirkan">Cuti Melahirkan</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Tanggal Mulai</label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Tanggal Selesai</label>
            <input 
              type="date" 
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Alasan / Keterangan</label>
          <textarea 
            rows="4"
            required
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Tuliskan alasan cuti Anda..."
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '1rem', resize: 'none' }}
          />
        </div>

        <button type="submit" style={{ 
          marginTop: '1rem',
          background: 'linear-gradient(135deg, #0062ff, #3b82f6)', 
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
          boxShadow: '0 8px 16px rgba(0, 98, 255, 0.2)'
        }}>
          <Send size={20} />
          Ajukan Cuti
        </button>
      </form>

      <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 1rem 0', fontWeight: 700 }}>Riwayat Pengajuan Cuti</h2>
        
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat riwayat...</p>
        ) : leaveHistory.length === 0 ? (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', margin: 0 }}>Belum ada riwayat pengajuan cuti.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaveHistory.map((item) => (
              <div key={item.id} style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {item.reason && item.reason.includes('Melahirkan') ? 'Cuti Melahirkan' : 'Cuti Tahunan'}
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.8rem' }}>
                  <Calendar size={14} />
                  <span>{new Date(item.start_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} s/d {new Date(item.end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px' }}>
                  {item.reason ? item.reason.replace(/\[.*?\]\s*/, '') : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLeave;
