import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

const UserHistory = () => {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const rawLogs = JSON.parse(localStorage.getItem('attendance_logs')) || [];
    
    // Group logs by date
    const grouped = {};
    rawLogs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = { id: log.date, date: log.date, timeIn: '-', timeOut: '-', status: 'Absen' };
      }
      if (log.type === 'in' || log.type === 'overtime_in') {
        grouped[log.date].timeIn = log.time;
        grouped[log.date].status = 'Hadir'; // simple logic
      } else if (log.type === 'out' || log.type === 'early' || log.type === 'overtime_out') {
        grouped[log.date].timeOut = log.time;
        if (grouped[log.date].timeIn !== '-') {
          grouped[log.date].status = 'Hadir';
        }
      }
    });

    const sortedData = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistoryData(sortedData);
  }, []);

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: 700 }}>Riwayat Presensi</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {historyData.length > 0 ? (
          historyData.map((item) => (
            <div key={item.id} style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '1.2rem', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 600 }}>
                  <Calendar size={18} color="#3b82f6" />
                  {item.date}
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  background: item.status === 'Hadir' ? '#dcfce7' : item.status === 'Terlambat' ? '#fef08a' : '#fee2e2',
                  color: item.status === 'Hadir' ? '#166534' : item.status === 'Terlambat' ? '#854d0e' : '#991b1b'
                }}>
                  {item.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '0.8rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>Masuk</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{item.timeIn}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '0.8rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>Pulang</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{item.timeOut}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            Belum ada riwayat presensi.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistory;
