import React, { useState } from 'react';
import { Calendar, FileText, Upload, Send } from 'lucide-react';

const UserLeave = () => {
  const [formData, setFormData] = useState({
    type: 'Tahunan',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const requestEntry = {
      id: Date.now().toString(),
      employeeId: 'EMP-001',
      employeeName: 'Budi Santoso',
      date: formData.startDate + ' s/d ' + formData.endDate,
      type: formData.type,
      reason: formData.reason,
      status: 'Menunggu',
      attachment: null // simplified for mock
    };

    const existingRequests = JSON.parse(localStorage.getItem('leave_requests')) || [];
    localStorage.setItem('leave_requests', JSON.stringify([requestEntry, ...existingRequests]));

    alert('Pengajuan cuti berhasil dikirim!');
    setFormData({ type: 'Tahunan', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>Pengajuan Cuti</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sisa Cuti Tahunan: <strong>10 Hari</strong></p>
      
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
