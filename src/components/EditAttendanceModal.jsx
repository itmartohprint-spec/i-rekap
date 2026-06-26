import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const EditAttendanceModal = ({ isOpen, onClose, employee, date, onSuccess }) => {
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isOpen && employee && date) {
      fetchExistingData();
    }
  }, [isOpen, employee, date]);

  const fetchExistingData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', date);

    if (error) {
      console.error('Error fetching data:', error);
    } else if (data) {
      setLogs(data);
      const inLog = data.find(l => l.type === 'in' || l.type === 'overtime_in');
      const outLog = data.find(l => l.type === 'out' || l.type === 'early' || l.type === 'overtime_out');
      
      setTimeIn(inLog && inLog.time_in ? inLog.time_in.substring(0, 5) : '');
      setTimeOut(outLog && outLog.time_out ? outLog.time_out.substring(0, 5) : '');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    
    const inLog = logs.find(l => l.type === 'in' || l.type === 'overtime_in');
    const outLog = logs.find(l => l.type === 'out' || l.type === 'early' || l.type === 'overtime_out');

    try {
      // Handle Time In
      if (timeIn) {
        if (inLog) {
          await supabase.from('attendance').update({ time_in: `${timeIn}:00` }).eq('id', inLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_in: `${timeIn}:00`,
            type: 'in',
            license_code: licenseCode
          });
        }
      } else if (inLog && !timeIn) {
         // Delete if emptied
         await supabase.from('attendance').delete().eq('id', inLog.id);
      }

      // Handle Time Out
      if (timeOut) {
        if (outLog) {
          await supabase.from('attendance').update({ time_out: `${timeOut}:00` }).eq('id', outLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_out: `${timeOut}:00`,
            type: 'out',
            license_code: licenseCode
          });
        }
      } else if (outLog && !timeOut) {
         // Delete if emptied
         await supabase.from('attendance').delete().eq('id', outLog.id);
      }

      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error saving data:', e);
      alert('Gagal menyimpan data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>Edit Data Absensi</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>Karyawan: <strong>{employee?.name}</strong></p>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>Tanggal: <strong>{date}</strong></p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}>Jam Masuk</label>
          <input 
            type="time" 
            className="form-input" 
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
            value={timeIn}
            onChange={(e) => setTimeIn(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}>Jam Pulang</label>
          <input 
            type="time" 
            className="form-input" 
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
