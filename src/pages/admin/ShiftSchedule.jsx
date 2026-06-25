import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ShiftSchedule = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate current week dates
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1; // First day is the day of the month - the day of the week
  
  const weekDates = Array.from({length: 5}).map((_, i) => {
    const d = new Date(curr.setDate(first + i));
    return d.toISOString().substring(0, 10);
  });

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${days[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .eq('license_code', licenseCode);

      const { data: attendances } = await supabase
        .from('attendance')
        .select('*')
        .eq('license_code', licenseCode)
        .gte('date', weekDates[0])
        .lte('date', weekDates[4])
        .eq('type', 'in');

      if (employees) {
        const computedSchedule = employees.map(emp => {
          const empAttendance = attendances ? attendances.filter(a => a.employee_id === emp.id) : [];
          
          const weeklyStatus = weekDates.map(date => {
            const isPresent = empAttendance.some(a => a.date === date);
            return isPresent ? 'Hadir' : '-';
          });

          return {
            id: emp.id,
            name: emp.name,
            weeklyStatus
          };
        });

        setScheduleData(computedSchedule);
      }
    } catch (err) {
      console.error("Error fetching shift schedule:", err);
    }
    
    setIsLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Jadwal & Kehadiran (Minggu Ini)</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={fetchSchedule}>Refresh</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              {weekDates.map((date, index) => (
                <th key={index}>{formatDateLabel(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : scheduleData.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data karyawan</td>
              </tr>
            ) : (
              scheduleData.map(row => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong></td>
                  {row.weeklyStatus.map((status, idx) => (
                    <td key={idx}>
                      {status === 'Hadir' ? (
                        <span className="status-badge badge-success">Hadir</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftSchedule;
