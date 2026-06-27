import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Send } from 'lucide-react';
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

  useEffect(() => {
    const fetchQuota = async () => {
      const employeeId = localStorage.getItem('user-id');
      const licenseCode = localStorage.getItem('valid-license');
      if (!employeeId || !licenseCode) return;

      const { data: empData } = await supabase
        .from('employees')
        .select('leave_quota')
        .eq('id', employeeId)
        .eq('license_code', licenseCode)
        .single();
      
      if (empData && empData.leave_quota !== undefined) {
        setLeaveQuota(empData.leave_quota);
      }

      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, status, reason')
        .eq('employee_id', employeeId)
        .eq('license_code', licenseCode)
        .like('reason', '%Cuti Tahunan%');

      if (leaveData) {
        let totalUsed = 0;
        leaveData.forEach(req => {
          if (req.status !== 'Ditolak' && req.status !== 'ditolak') {
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
    };
    fetchQuota();
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
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>Pengajuan Cuti</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sisa Cuti Tahunan: <strong>{leaveQuota - usedLeave} Hari</strong></p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
    </div>
  );
};

export default UserLeave;
