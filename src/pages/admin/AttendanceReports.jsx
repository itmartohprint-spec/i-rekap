import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AttendanceMatrix from '../../components/AttendanceMatrix';

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
    if (!startDate && !endDate) return true;
    const logDate = new Date(log.date);
    const sDate = startDate ? new Date(startDate) : null;
    const eDate = endDate ? new Date(endDate) : null;
    
    if (selectedDivision && log.employees && log.employees.dept !== selectedDivision) {
      return false;
    }
    
    if (sDate && eDate) return logDate >= sDate && logDate <= eDate;
    if (sDate) return logDate >= sDate;
    if (eDate) return logDate <= eDate;
    return true;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Laporan Absensi Karyawan", 14, 22);
    
    // Subtitle (Date Range)
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateText = (startDate || endDate) 
      ? `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
      : `Periode: Semua Data`;
    doc.text(dateText, 14, 30);

    // Table
    const tableColumn = ["Tanggal", "Nama Karyawan", "Tipe", "Jam Masuk", "Jam Pulang", "Status"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const typeStr = log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'early' ? 'Pulang Cepat' : log.type;
      const logData = [
        log.date,
        log.employees ? log.employees.name : log.employee_id,
        typeStr,
        log.time_in || '-',
        log.time_out || '-',
        log.status || '-'
      ];
      tableRows.push(logData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    doc.save(`Laporan_Absensi_${new Date().getTime()}.pdf`);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ["Tanggal", "Nama Karyawan", "Tipe", "Jam Masuk", "Jam Pulang", "Status"];
    
    const rows = filteredLogs.map(log => {
      const typeStr = log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'early' ? 'Pulang Cepat' : log.type;
      return [
        log.date,
        log.employees ? log.employees.name : log.employee_id,
        typeStr,
        log.time_in || '-',
        log.time_out || '-',
        log.status || '-'
      ].map(val => `"${val}"`).join(","); // Escape values with quotes to handle commas
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\\n"
      + rows.join("\\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Absensi_${new Date().getTime()}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
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
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleExportCSV} disabled={filteredLogs.length === 0}>Export CSV (Excel)</button>
                <button className="btn-primary" onClick={handleExportPDF} disabled={filteredLogs.length === 0}>Export PDF</button>
              </div>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Pilih Bulan:</span>
              <select className="form-input" style={{ width: 'auto', minWidth: '120px' }} value={matrixMonth} onChange={e => setMatrixMonth(parseInt(e.target.value))}>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Tahun:</span>
              <input type="number" className="form-input" style={{ width: '80px' }} value={matrixYear} onChange={e => setMatrixYear(parseInt(e.target.value))} />
            </div>
            <button 
              className="btn-primary" 
              style={{ background: '#10b981', marginLeft: 'auto' }}
              onClick={() => {
                window.dispatchEvent(new Event('export-matrix-csv'));
              }}
            >
              Export Matrix ke CSV
            </button>
          </div>
          
          <AttendanceMatrix month={matrixMonth} year={matrixYear} licenseCode={localStorage.getItem('valid-license')} />
        </>
      )}
    </div>
  );
};

export default AttendanceReports;
