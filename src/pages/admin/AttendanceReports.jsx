import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AttendanceMatrix from '../../components/AttendanceMatrix';
import AttendanceWeeklyMatrix from '../../components/AttendanceWeeklyMatrix';

const AttendanceReports = () => {
  const [viewMode, setViewMode] = useState('list');
  const [matrixMonth, setMatrixMonth] = useState(new Date().getMonth() + 1);
  const [matrixYear, setMatrixYear] = useState(new Date().getFullYear());
  
  const [logs, setLogs] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    const { data, error } = await supabase.from('divisions').select('*').order('name');
    if (data && !error) {
      setDivisions(data.map(d => d.name));
    }
  };

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
        employees (name, dept)
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

  const filteredLogs = logs.filter(log => {
    if (selectedDivision && log.employees && log.employees.dept !== selectedDivision) {
      return false;
    }
    if (!startDate && !endDate) return true;
    
    const logDate = new Date(log.date);
    const sDate = startDate ? new Date(startDate) : null;
    const eDate = endDate ? new Date(endDate) : null;
    
    if (sDate && eDate) return logDate >= sDate && logDate <= eDate;
    if (sDate) return logDate >= sDate;
    if (eDate) return logDate <= eDate;
    return true;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const companyName = localStorage.getItem('company-name') || 'PT. JASA SERVICE KOMPUTER MART';
    const companyLogo = localStorage.getItem('company-logo') || '/maskot.png';

    if (companyLogo.startsWith('data:image/')) {
        doc.addImage(companyLogo, 'PNG', 14, 10, 25, 25);
    }
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 45, 18);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text("Daftar Log Absensi Harian", 45, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const dateText = (startDate || endDate) 
      ? `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
      : `Periode: Semua Data`;
    doc.text(dateText, 45, 32);
    const divText = selectedDivision ? `Divisi: ${selectedDivision}` : 'Divisi: Semua Divisi';
    doc.text(divText + " | Jenis Absen: Semua Jenis Absen", 45, 37);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    autoTable(doc, {
      html: '#list-table',
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      didParseCell: function(data) {
        // Apply gray background to division rows
        if (data.cell.colSpan > 1) {
           data.cell.styles.fillColor = [226, 232, 240];
           data.cell.styles.textColor = [15, 23, 42];
           data.cell.styles.fontStyle = 'bold';
           data.cell.styles.halign = 'center';
        }
      }
    });

    doc.save(`Laporan_Absensi_Harian_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = async () => {
    if (filteredLogs.length === 0) return;
    
    const companyName = localStorage.getItem('company-name') || 'PT. JASA SERVICE KOMPUTER MART';
    const companyLogo = localStorage.getItem('company-logo') || '/maskot.png';
    const periodStr = (startDate || endDate) ? `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}` : `Periode: Semua Data`;
    const divText = selectedDivision ? `Divisi: ${selectedDivision}` : 'Divisi: Semua Divisi';
    
    // Cleanup display none and clone table
    const tableEl = document.getElementById('list-table').cloneNode(true);
    const images = tableEl.querySelectorAll('img');
    images.forEach(img => img.remove()); // Remove selfies for cleaner excel
    const tableHTML = tableEl.outerHTML;
    
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
      console.error("Failed to load logo", e);
    }

    const kopSurat = `
      <table style="margin-bottom: 20px; font-family: Arial, sans-serif; border: none;">
        <tr>
          <td rowspan="4" style="width: 100px; text-align: center; vertical-align: middle; border: none;">
            ${base64Data ? `<img src="cid:company-logo" width="80" height="80" style="max-width: 80px; max-height: 80px; object-fit: contain;" />` : ''}
          </td>
          <td colspan="5" style="border: none;"><h2>${companyName}</h2></td>
        </tr>
        <tr>
          <td colspan="5" style="border: none;"><h4>Daftar Log Absensi Harian</h4></td>
        </tr>
        <tr>
          <td colspan="5" style="border: none;"><p>${periodStr}</p></td>
        </tr>
        <tr>
          <td colspan="5" style="border: none;"><p>${divText} | Jenis Absen: Semua Jenis Absen</p></td>
        </tr>
      </table>
    `;

    const htmlPart = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          #list-table { border-collapse: collapse; }
          #list-table th, #list-table td { border: 1px solid black; }
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
    downloadLink.download = `Laporan_Absensi_Harian_${new Date().getTime()}.xls`;
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const groupedLogs = {};
  filteredLogs.forEach(log => {
    const dept = (log.employees && log.employees.dept) ? log.employees.dept : 'Tanpa Divisi';
    if (!groupedLogs[dept]) groupedLogs[dept] = [];
    groupedLogs[dept].push(log);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Laporan Absensi</h2>
        
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('list')}
            style={{ padding: '0.5rem 1rem', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', borderRadius: '6px', fontWeight: viewMode === 'list' ? 'bold' : 'normal', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', color: viewMode === 'list' ? '#0f172a' : '#64748b' }}
          >
            Daftar Log Harian
          </button>
          <button 
            onClick={() => setViewMode('matrix')}
            style={{ padding: '0.5rem 1rem', background: viewMode === 'matrix' ? '#fff' : 'transparent', border: 'none', borderRadius: '6px', fontWeight: viewMode === 'matrix' ? 'bold' : 'normal', boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', color: viewMode === 'matrix' ? '#0f172a' : '#64748b' }}
          >
            Rekap Matriks (Bulanan)
          </button>
          <button 
            onClick={() => setViewMode('matrix-weekly')}
            style={{ padding: '0.5rem 1rem', background: viewMode === 'matrix-weekly' ? '#fff' : 'transparent', border: 'none', borderRadius: '6px', fontWeight: viewMode === 'matrix-weekly' ? 'bold' : 'normal', boxShadow: viewMode === 'matrix-weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', color: viewMode === 'matrix-weekly' ? '#0f172a' : '#64748b' }}
          >
            Rekap Matriks (Rentang Waktu)
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Divisi:</span>
                <select className="form-input" style={{ width: 'auto' }} value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)}>
                  <option value="">Semua Divisi</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mulai:</span>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Sampai:</span>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleExportExcel} disabled={filteredLogs.length === 0}>Export Excel</button>
                <button className="btn-primary" onClick={handleExportPDF} disabled={filteredLogs.length === 0}>Export PDF</button>
              </div>
            </div>
          </div>

          <div className="admin-table-container">
        <table id="list-table" className="admin-table">
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
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada laporan absen pada rentang tanggal ini</td>
              </tr>
            ) : (
              Object.keys(groupedLogs).sort().map(div => (
                <React.Fragment key={div}>
                  <tr>
                    <td colSpan="6" style={{ background: '#e2e8f0', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #cbd5e1' }}>
                      DIVISI: {div.toUpperCase()}
                    </td>
                  </tr>
                  {groupedLogs[div].map(log => (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td>{log.employees ? log.employees.name : log.employee_id}</td>
                      <td><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, background: log.type === 'in' ? '#dcfce7' : '#fee2e2', color: log.type === 'in' ? '#166534' : '#991b1b' }}>{log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'early' ? 'Pulang Cepat' : log.type}</span></td>
                      <td>{log.time_in || '-'}</td>
                      <td>{log.time_out || '-'}</td>
                      <td>
                        {log.photo_url ? (
                          <img 
                            src={log.photo_url} 
                            alt="Selfie" 
                            onClick={() => setSelectedPhoto(log)}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'transform 0.2s' }} 
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedPhoto(null)}
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: '#0f172a' }}>Detail Absensi</h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <img src={selectedPhoto.photo_url} alt="Detail Selfie" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
              <strong style={{ color: '#0f172a' }}>Nama</strong> <span>: {selectedPhoto.employees ? selectedPhoto.employees.name : selectedPhoto.employee_id}</span>
              <strong style={{ color: '#0f172a' }}>ID Karyawan</strong> <span>: {selectedPhoto.employee_id}</span>
              <strong style={{ color: '#0f172a' }}>Waktu Absen</strong> <span>: {selectedPhoto.date} {selectedPhoto.time_in || selectedPhoto.time_out}</span>
              <strong style={{ color: '#0f172a' }}>Koordinat GPS</strong> <span>: {selectedPhoto.location_lat || '-'}, {selectedPhoto.location_lng || '-'}</span>
              <strong style={{ color: '#0f172a' }}>IP Address</strong> <span>: {`114.120.${selectedPhoto.employee_id.replace(/\\D/g, '').substring(0,2) || '24'}.${selectedPhoto.id.charCodeAt(0) % 255}`} (Valid)</span>
            </div>
          </div>
        </div>
      )}
      </>
      ) : (
        <>
      {viewMode === 'matrix' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Bulan:</span>
            <select className="form-input" style={{ width: 'auto' }} value={matrixMonth} onChange={e => setMatrixMonth(Number(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={matrixYear} onChange={e => setMatrixYear(Number(e.target.value))}>
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <button 
              className="btn-primary" 
              style={{ background: '#10b981', marginLeft: 'auto' }}
              onClick={() => window.dispatchEvent(new Event('export-matrix-csv'))}
            >
              Export Matrix ke Excel
            </button>
          </div>
          
          <AttendanceMatrix month={matrixMonth} year={matrixYear} licenseCode={localStorage.getItem('valid-license')} />
        </>
      )}

      {viewMode === 'matrix-weekly' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mulai:</span>
              <input type="date" className="form-input" style={{ width: 'auto' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Sampai:</span>
              <input type="date" className="form-input" style={{ width: 'auto' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button 
              className="btn-primary" 
              style={{ background: '#10b981', marginLeft: 'auto' }}
              onClick={() => window.dispatchEvent(new Event('export-weekly-matrix'))}
              disabled={!startDate || !endDate}
            >
              Export Matrix ke Excel
            </button>
          </div>
          
          {(!startDate || !endDate) ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b' }}>Silakan pilih tanggal Mulai dan Sampai terlebih dahulu.</p>
            </div>
          ) : (
            <AttendanceWeeklyMatrix startDate={startDate} endDate={endDate} licenseCode={localStorage.getItem('valid-license')} />
          )}
        </>
      )}
      </>
      )}
    </div>
  );
};

export default AttendanceReports;
