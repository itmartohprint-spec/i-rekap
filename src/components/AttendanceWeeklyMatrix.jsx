import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AttendanceWeeklyMatrix = ({ startDate, endDate, licenseCode }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate array of dates between startDate and endDate
  const generateDates = () => {
    if (!startDate || !endDate) return [];
    const arr = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      arr.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return arr;
  };

  const datesArray = generateDates();
  const numDays = datesArray.length;
  
  const companyName = localStorage.getItem('company-name') || 'PT. JASA SERVICE KOMPUTER MART';
  const companyLogo = localStorage.getItem('company-logo') || '/maskot.png';
  const periodStr = `Periode: ${startDate || ''} s/d ${endDate || ''}`;
  
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, licenseCode]);

  useEffect(() => {
    const handleExport = async () => {
      if (!data) return;
      
      const tableHTML = document.getElementById('matrix-weekly-table').outerHTML.replace(/display:\s*none/g, '');
      
      let base64Data = "";
      let mimeType = "image/png";
      
      try {
        if (companyLogo.startsWith('data:')) {
          const parts = companyLogo.split(',');
          mimeType = parts[0].match(/:(.*?);/)[1];
          base64Data = parts[1];
        } else {
          const response = await fetch(companyLogo);
          const blob = await response.blob();
          mimeType = blob.type;
          base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
               const b64 = reader.result.split(',')[1];
               resolve(b64);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.error("Failed to load logo for export", e);
      }

      const kopSurat = `
        <table style="margin-bottom: 20px; font-family: Arial, sans-serif; border: none;">
          <tr>
            <td rowspan="4" style="width: 100px; text-align: center; vertical-align: middle; border: none;">
              ${base64Data ? `<img src="cid:company-logo" width="80" height="80" style="max-width: 80px; max-height: 80px; object-fit: contain;" />` : ''}
            </td>
            <td colspan="10" style="border: none;"><h2>${companyName}</h2></td>
          </tr>
          <tr>
            <td colspan="10" style="border: none;"><h4>Rekap Absensi (Rentang Waktu)</h4></td>
          </tr>
          <tr>
            <td colspan="10" style="border: none;"><p>${periodStr}</p></td>
          </tr>
          <tr>
            <td colspan="10" style="border: none;"><p>Divisi: Semua Divisi | Jenis Absen: Semua Jenis Absen</p></td>
          </tr>
        </table>
      `;

      const htmlPart = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Rekap Matrix Mingguan</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            #matrix-weekly-table { border-collapse: collapse; }
            #matrix-weekly-table th, #matrix-weekly-table td { border: 1px solid black; }
            td { mso-number-format:"\\@"; }
          </style>
        </head>
        <body>
          ${kopSurat}
          ${tableHTML}
        </body>
        </html>
      `;

      const mhtml = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="----Excel_Export_Boundary"

------Excel_Export_Boundary
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 8bit

${htmlPart}

------Excel_Export_Boundary
Content-Type: ${mimeType}
Content-Transfer-Encoding: base64
Content-Location: company-logo

${base64Data}
------Excel_Export_Boundary--`;
      
      const blob = new Blob([mhtml], { type: 'application/vnd.ms-excel' });
      const downloadLink = document.createElement("a");
      downloadLink.download = `Rekap_Absensi_Matrix_Custom.xls`;
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    window.addEventListener('export-weekly-matrix', handleExport);
    return () => window.removeEventListener('export-weekly-matrix', handleExport);
  }, [data, startDate, endDate, companyName, periodStr]);

  const fetchData = async () => {
    if (!licenseCode || !startDate || !endDate || datesArray.length === 0) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Fetch Employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('license_code', licenseCode)
        .order('name');
        
      // 2. Fetch Attendance
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
      
      datesArray.forEach(dateStr => {
        
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
        
        daily[dateStr] = {
          timeIn: leaveStatus ? leaveStatus : timeIn,
          timeOut: leaveStatus ? leaveStatus : timeOut,
          isWeekend: new Date(dateStr).getDay() === 0 // Sunday
        };
      });
      
      const totalAlpa = numDays - (totalMasuk + totalIzin + totalSakit + totalCuti);
      
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

      <table id="matrix-weekly-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1500px' }}>
        <thead>
          <tr>
            <th rowSpan="2" style={thStyle}>No</th>
            <th rowSpan="2" style={thStyle}>Nama Karyawan</th>
            <th colSpan={numDays} style={{...thStyle, background: '#f59e0b', color: '#fff'}}>Tanggal (Rentang)</th>
            <th colSpan="7" style={{...thStyle, background: '#1e3a8a', color: '#fff'}}>Rekapitulasi Total</th>
          </tr>
          <tr>
            {datesArray.map(dateStr => (
              <th key={dateStr} style={{...thStyle, background: '#fef3c7', color: '#92400e', width: '35px'}}>{dateStr.split('-')[2]}</th>
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
                <td colSpan={numDays + 9} style={{ background: '#e2e8f0', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #cbd5e1' }}>
                  DIVISI: {div.toUpperCase()}
                </td>
              </tr>
              {data[div].map((emp, empIdx) => (
                <tr key={emp.id}>
                  <td style={tdStyle}>{empIdx + 1}</td>
                  <td style={{...tdStyle, textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600}}>{emp.name}</td>
                  
                  {datesArray.map(dateStr => {
                    const cell = emp.daily[dateStr];
                    const isWeekend = cell.isWeekend;
                    const isLeave = ['S', 'I', 'C'].includes(cell.timeIn);
                    
                    return (
                      <td key={dateStr} style={{...tdStyle, background: isWeekend ? '#fee2e2' : 'transparent', padding: '2px', msoNumberFormat: '"\\@"'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem' }}>
                          {isLeave ? (
                            <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>{cell.timeIn}</span>
                          ) : (
                            <>
                              <span style={{ borderBottom: '1px solid #e2e8f0', width: '100%', paddingBottom: '2px', marginBottom: '2px', color: cell.timeIn !== '-' ? '#15803d' : '#94a3b8' }}>
                                {cell.timeIn}
                              </span>
                              <br style={{ msoDataPlacement: 'same-cell', display: 'none' }} className="excel-newline" />
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

export default AttendanceWeeklyMatrix;
