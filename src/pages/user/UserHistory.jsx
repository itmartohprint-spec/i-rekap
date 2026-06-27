import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UserHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user-id');
    const licenseCode = localStorage.getItem('valid-license');

    if (!userId || !licenseCode) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch regular attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('employee_id', userId)
      .order('date', { ascending: false });

    // 2. Fetch leave/sick requests
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('employee_id', userId)
      .order('start_date', { ascending: false });

    const grouped = {};

    if (attendanceData) {
      attendanceData.forEach(log => {
        if (!grouped[log.date]) {
          grouped[log.date] = { id: log.date, date: log.date, timeIn: '-', timeOut: '-', status: '-' };
        }
        
        if (log.type === 'in' || log.type === 'overtime_in') {
          grouped[log.date].timeIn = log.time_in || '-';
          grouped[log.date].status = log.status || 'Hadir';
        } else if (log.type === 'out' || log.type === 'early' || log.type === 'overtime_out') {
          grouped[log.date].timeOut = log.time_out || '-';
          if (grouped[log.date].status === '-') {
            grouped[log.date].status = 'Hadir'; // if they only checked out
          }
        }
      });
    }

    if (leaveData) {
      leaveData.forEach(leave => {
        const d = leave.start_date;
        // Extract "Izin" or "Sakit" from "[Izin] Reason..."
        let leaveType = 'Cuti/Izin';
        if (leave.reason && leave.reason.startsWith('[')) {
          leaveType = leave.reason.split(']')[0].replace('[', '');
        }

        if (!grouped[d]) {
          grouped[d] = { id: `leave-${leave.id}`, date: d, timeIn: '-', timeOut: '-', status: leaveType };
        } else {
          grouped[d].status = leaveType; // override status if there's a leave on that date
        }
      });
    }

    const sortedData = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistoryData(sortedData);
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    if (status === 'Hadir' || status === 'Hadir (Selesai)') return { bg: '#dcfce7', text: '#166534' };
    if (status === 'Terlambat') return { bg: '#fef08a', text: '#854d0e' };
    if (status === 'Izin' || status === 'Sakit') return { bg: '#e0e7ff', text: '#3730a3' }; // Blueish for leave
    return { bg: '#fee2e2', text: '#991b1b' }; // default redish
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: 700 }}>Riwayat Presensi</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>Memuat data...</div>
        ) : historyData.length > 0 ? (
          historyData.map((item) => {
            const colors = getStatusColor(item.status);
            return (
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
                    {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: colors.bg,
                    color: colors.text
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
            );
          })
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
