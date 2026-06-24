import React from 'react';

const AttendanceReports = () => {
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
              <th>Jam Masuk</th>
              <th>Jam Pulang</th>
              <th>Lokasi</th>
              <th>Selfie</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada laporan absen</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReports;
