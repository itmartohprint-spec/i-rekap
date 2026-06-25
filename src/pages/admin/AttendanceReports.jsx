import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AttendanceReports = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees (name)
      `)
      .eq('license_code', licenseCode)
      .order('date', { ascending: false })
      .order('time_in', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
    } else if (data) {
      setLogs(data);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Laporan Absensi</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input type="date" className="form-input" style={{ width: 'auto' }} />
          <button className="btn-primary">Export PDF</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Karyawan</th>
              <th>Tipe</th>
              <th>Jam Masuk</th>
              <th>Jam Pulang</th>
              <th>Selfie</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada laporan absen</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.employees ? log.employees.name : log.employee_id}</td>
                  <td><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, background: log.type === 'in' ? '#dcfce7' : '#fee2e2', color: log.type === 'in' ? '#166534' : '#991b1b' }}>{log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'early' ? 'Pulang Cepat' : log.type}</span></td>
                  <td>{log.time_in || '-'}</td>
                  <td>{log.time_out || '-'}</td>
                  <td>
                    {log.photo_url ? (
                      <img src={log.photo_url} alt="Selfie" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReports;
