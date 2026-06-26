import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AttendanceMatrix = ({ month, year, licenseCode }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Constants
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const companyName = localStorage.getItem('company-name') || 'PT Maju Bersama';
  const companyLogo = localStorage.getItem('company-logo') || '/maskot.png';
  const lastDay = new Date(year, month, 0).getDate();
  const periodStr = `Periode: ${year}-${String(month).padStart(2, '0')}-01 s/d ${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  
  useEffect(() => {
    fetchData();
  }, [month, year, licenseCode]);

  useEffect(() => {
    const handleExport = () => {
      if (!data) return;
      
      let csv = [];
      // 1. KOP SURAT
      csv.push(`"${companyName}"`);
      csv.push(`"Rekap Absensi Bulanan"`);
      csv.push(`"${periodStr}"`);
      csv.push(`"Divisi: Semua Divisi | Jenis Absen: Semua Jenis Absen"`);
      csv.push(`""`); // Empty line
      
      // 2. HEADER
      let headerRow1 = ['"No"', '"Nama Karyawan"'];
      for (let i = 1; i <= daysInMonth; i++) {
        if (i === 1) headerRow1.push(`"Tanggal (${year}-${String(month).padStart(2, '0')})"`);
        else headerRow1.push(`""`);
      }
      headerRow1.push('"Rekapitulasi Total"');
      for (let i = 0; i < 6; i++) headerRow1.push(`""`);
      csv.push(headerRow1.join(","));

      let headerRow2 = ['""', '""'];
      for (let i = 1; i <= daysInMonth; i++) {
        headerRow2.push(`"${String(i).padStart(2, '0')}"`);
      }
      headerRow2.push('"Masuk"', '"Izin"', '"Sakit"', '"Cuti"', '"Alpa"', '"Jam Kerja"', '"Lembur"');
      csv.push(headerRow2.join(","));
      
      // 3. BODY
      Object.keys(data).sort().forEach(div => {
        let divRow = [`"DIVISI: ${div.toUpperCase()}"`];
        for (let i = 0; i < daysInMonth + 8; i++) divRow.push(`""`);
        csv.push(divRow.join(","));
        
        data[div].forEach((emp, empIdx) => {
          let empRow = [`"${empIdx + 1}"`, `"${emp.name}"`];
          daysArray.forEach(d => {
            const cell = emp.daily[d];
            if (['S', 'I', 'C'].includes(cell.timeIn)) {
              empRow.push(`"${cell.timeIn}"`);
            } else {
              empRow.push(`"${cell.timeIn} - ${cell.timeOut}"`);
            }
          });
          empRow.push(`"${emp.totalMasuk}"`, `"${emp.totalIzin}"`, `"${emp.totalSakit}"`, `"${emp.totalCuti}"`, `"${emp.totalAlpa}"`, `"${emp.totalJamKerja}j"`, `"${emp.totalLembur}j"`);
          csv.push(empRow.join(","));
        });
      });

      const csvFile = new Blob([csv.join("\\n")], {type: "text/csv;charset=utf-8;"});
      const downloadLink = document.createElement("a");
      downloadLink.download = `Rekap_Absensi_${year}_${month}.csv`;
      downloadLink.href = window.URL.createObjectURL(csvFile);
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
    };

    window.addEventListener('export-matrix-csv', handleExport);
    return () => window.removeEventListener('export-matrix-csv', handleExport);
  }, [data, month, year, companyName, periodStr]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('license_code', licenseCode);
        
      // 2. Fetch Attendance
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('license_code', licenseCode)
        .gte('date', startDate)
        .lte('date', endDate);
        
      // 3. Fetch Leaves
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('license_code', licenseCode)
        .eq('status', 'approved')
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      // 4. Process Data
      const processed = processData(employeesData || [], attendanceData || [], leaveData || []);
      setData(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const processData = (employees, attendance, leaves) => {
    const grouped = {};
    
    employees.forEach(emp => {
      const div = emp.dept || 'Tanpa Divisi';
      if (!grouped[div]) grouped[div] = [];
      
      // Initialize daily matrix
      const daily = {};
      let totalMasuk = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalCuti = 0;
      let totalJamKerja = 0;
      let totalLembur = 0;
      
      daysArray.forEach(d => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Find attendance
        const logs = attendance.filter(a => a.employee_id === emp.id && a.date === dateStr);
        let timeIn = '-';
        let timeOut = '-';
        
        const inLog = logs.find(l => l.type === 'in' || l.type === 'overtime_in');
        const outLog = logs.find(l => l.type === 'out' || l.type === 'early' || l.type === 'overtime_out');
        
        if (inLog) timeIn = inLog.time_in ? inLog.time_in.substring(0, 5) : '-';
        if (outLog) timeOut = outLog.time_out ? outLog.time_out.substring(0, 5) : '-';
        
        // Find leaves
        let leaveStatus = null;
        const leave = leaves.find(l => dateStr >= l.start_date && dateStr <= l.end_date && l.employee_id === emp.id);
        if (leave) {
          const reason = leave.reason.toLowerCase();
          if (reason.includes('sakit')) leaveStatus = 'S';
          else if (reason.includes('cuti')) leaveStatus = 'C';
          else leaveStatus = 'I';
        }

        if (inLog || outLog) {
          totalMasuk++;
          // Calculate hours
          if (inLog && inLog.time_in && outLog && outLog.time_out) {
             const start = new Date(`1970-01-01T${inLog.time_in}`);
             const end = new Date(`1970-01-01T${outLog.time_out}`);
             let diff = (end - start) / (1000 * 60 * 60);
             if (diff > 0) totalJamKerja += diff;
             
             if (inLog.type === 'overtime_in' || outLog.type === 'overtime_out') {
                 totalLembur += diff > 8 ? diff - 8 : 0; // rough calculation
             }
          }
        } else if (leaveStatus === 'S') totalSakit++;
        else if (leaveStatus === 'C') totalCuti++;
        else if (leaveStatus === 'I') totalIzin++;
        
        daily[d] = {
          timeIn: leaveStatus ? leaveStatus : timeIn,
          timeOut: leaveStatus ? leaveStatus : timeOut,
          isWeekend: new Date(year, month - 1, d).getDay() === 0 // Sunday
        };
      });
      
      const totalAlpa = daysInMonth - (totalMasuk + totalIzin + totalSakit + totalCuti);
      
      grouped[div].push({
        ...emp,
        daily,
        totalMasuk, totalIzin, totalSakit, totalCuti, totalAlpa: Math.max(0, totalAlpa),
        totalJamKerja: Math.floor(totalJamKerja),
        totalLembur: Math.floor(totalLembur)
      });
    });
    
    return grouped;
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data matriks...</div>;
  if (!data) return null;

  return (
    <div style={{ overflowX: 'auto', background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* KOP SURAT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #1e293b' }}>
        <div style={{ width: '80px', height: '80px', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <img src={companyLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#0f172a', textTransform: 'uppercase' }}>{companyName}</h2>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#334155' }}>Rekap Absensi Bulanan</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{periodStr}</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#475569' }}>Divisi: Semua Divisi | Jenis Absen: Semua Jenis Absen</p>
        </div>
      </div>

      <table id="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1500px' }}>
        <thead>
          <tr>
            <th rowSpan="2" style={thStyle}>No</th>
            <th rowSpan="2" style={thStyle}>Nama Karyawan</th>
            <th colSpan={daysInMonth} style={{...thStyle, background: '#f59e0b', color: '#fff'}}>Tanggal ({year}-{String(month).padStart(2, '0')})</th>
            <th colSpan="7" style={{...thStyle, background: '#1e3a8a', color: '#fff'}}>Rekapitulasi Total</th>
          </tr>
          <tr>
            {daysArray.map(d => (
              <th key={d} style={{...thStyle, background: '#fef3c7', color: '#92400e', width: '35px'}}>{String(d).padStart(2, '0')}</th>
            ))}
            <th style={thStyle}>Masuk</th>
            <th style={thStyle}>Izin</th>
            <th style={thStyle}>Sakit</th>
            <th style={thStyle}>Cuti</th>
            <th style={thStyle}>Alpa</th>
            <th style={thStyle}>Jam Kerja</th>
            <th style={thStyle}>Lembur</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(data).sort().map((div, divIdx) => (
            <React.Fragment key={div}>
              <tr>
                <td colSpan={daysInMonth + 9} style={{ background: '#e2e8f0', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #cbd5e1' }}>
                  DIVISI: {div.toUpperCase()}
                </td>
              </tr>
              {data[div].map((emp, empIdx) => (
                <tr key={emp.id}>
                  <td style={tdStyle}>{empIdx + 1}</td>
                  <td style={{...tdStyle, textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600}}>{emp.name}</td>
                  
                  {daysArray.map(d => {
                    const cell = emp.daily[d];
                    const isWeekend = cell.isWeekend;
                    const isLeave = ['S', 'I', 'C'].includes(cell.timeIn);
                    
                    return (
                      <td key={d} style={{...tdStyle, background: isWeekend ? '#fee2e2' : 'transparent', padding: '2px'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem' }}>
                          {isLeave ? (
                            <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>{cell.timeIn}</span>
                          ) : (
                            <>
                              <span style={{ borderBottom: '1px solid #e2e8f0', width: '100%', paddingBottom: '2px', marginBottom: '2px', color: cell.timeIn !== '-' ? '#15803d' : '#94a3b8' }}>
                                {cell.timeIn}
                              </span>
                              <span style={{ color: cell.timeOut !== '-' ? '#b91c1c' : '#94a3b8' }}>
                                {cell.timeOut}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{emp.totalMasuk}</td>
                  <td style={tdStyle}>{emp.totalIzin}</td>
                  <td style={tdStyle}>{emp.totalSakit}</td>
                  <td style={tdStyle}>{emp.totalCuti}</td>
                  <td style={{...tdStyle, color: emp.totalAlpa > 0 ? '#b91c1c' : 'inherit'}}>{emp.totalAlpa}</td>
                  <td style={tdStyle}>{emp.totalJamKerja}j</td>
                  <td style={tdStyle}>{emp.totalLembur}j</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  border: '1px solid #94a3b8',
  padding: '8px 4px',
  textAlign: 'center',
  fontWeight: 'bold',
  background: '#f8fafc',
  color: '#334155'
};

const tdStyle = {
  border: '1px solid #cbd5e1',
  padding: '4px',
  textAlign: 'center',
  verticalAlign: 'middle',
  color: '#475569'
};

export default AttendanceMatrix;
