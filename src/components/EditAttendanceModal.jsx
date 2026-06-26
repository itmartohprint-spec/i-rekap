import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const EditAttendanceModal = ({ isOpen, onClose, employee, date, onSuccess }) => {
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [overtimeIn, setOvertimeIn] = useState('');
  const [overtimeOut, setOvertimeOut] = useState('');
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
      const normalInLog = data.find(l => l.type === 'in');
      const normalOutLog = data.find(l => l.type === 'out' || l.type === 'early');
      const overtimeInLog = data.find(l => l.type === 'overtime_in');
      const overtimeOutLog = data.find(l => l.type === 'overtime_out');
      
      setTimeIn(normalInLog && normalInLog.time_in ? normalInLog.time_in.substring(0, 5) : '');
      setTimeOut(normalOutLog && normalOutLog.time_out ? normalOutLog.time_out.substring(0, 5) : '');
      setOvertimeIn(overtimeInLog && overtimeInLog.time_in ? overtimeInLog.time_in.substring(0, 5) : '');
      setOvertimeOut(overtimeOutLog && overtimeOutLog.time_out ? overtimeOutLog.time_out.substring(0, 5) : '');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    
    const normalInLog = logs.find(l => l.type === 'in');
    const normalOutLog = logs.find(l => l.type === 'out' || l.type === 'early');
    const overtimeInLog = logs.find(l => l.type === 'overtime_in');
    const overtimeOutLog = logs.find(l => l.type === 'overtime_out');

    try {
      // Handle Normal Time In
      if (timeIn) {
        if (normalInLog) {
          await supabase.from('attendance').update({ time_in: `${timeIn}:00` }).eq('id', normalInLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_in: `${timeIn}:00`,
            type: 'in',
            license_code: licenseCode
          });
        }
      } else if (normalInLog && !timeIn) {
         await supabase.from('attendance').delete().eq('id', normalInLog.id);
      }

      // Handle Normal Time Out
      if (timeOut) {
        if (normalOutLog) {
          await supabase.from('attendance').update({ time_out: `${timeOut}:00` }).eq('id', normalOutLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_out: `${timeOut}:00`,
            type: 'out',
            license_code: licenseCode
          });
        }
      } else if (normalOutLog && !timeOut) {
         await supabase.from('attendance').delete().eq('id', normalOutLog.id);
      }

      // Handle Overtime In
      if (overtimeIn) {
        if (overtimeInLog) {
          await supabase.from('attendance').update({ time_in: `${overtimeIn}:00` }).eq('id', overtimeInLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_in: `${overtimeIn}:00`,
            type: 'overtime_in',
            license_code: licenseCode
          });
        }
      } else if (overtimeInLog && !overtimeIn) {
         await supabase.from('attendance').delete().eq('id', overtimeInLog.id);
      }

      // Handle Overtime Out
      if (overtimeOut) {
        if (overtimeOutLog) {
          await supabase.from('attendance').update({ time_out: `${overtimeOut}:00` }).eq('id', overtimeOutLog.id);
        } else {
          await supabase.from('attendance').insert({
            employee_id: employee.id,
            date: date,
            time_out: `${overtimeOut}:00`,
            type: 'overtime_out',
            license_code: licenseCode
          });
        }
      } else if (overtimeOutLog && !overtimeOut) {
         await supabase.from('attendance').delete().eq('id', overtimeOutLog.id);
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#15803d' }}>Nrml: Jam Masuk</label>
            <input 
              type="time" 
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#b91c1c' }}>Nrml: Jam Pulang</label>
            <input 
              type="time" 
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#15803d' }}>Lmbr: Jam Masuk</label>
            <input 
              type="time" 
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }} 
              value={overtimeIn}
              onChange={(e) => setOvertimeIn(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#b91c1c' }}>Lmbr: Jam Pulang</label>
            <input 
              type="time" 
              className="form-input" 
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }} 
              value={overtimeOut}
              onChange={(e) => setOvertimeOut(e.target.value)}
            />
          </div>
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
