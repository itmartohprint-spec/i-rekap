import React from 'react';

const ShiftSchedule = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Jadwal Shift Karyawan</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-input" style={{ width: 'auto' }}>
            <option>Minggu Ini (22 - 28 Jun 2026)</option>
            <option>Minggu Depan (29 Jun - 05 Jul 2026)</option>
          </select>
          <button className="btn-primary">Atur Shift</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Senin (22/06)</th>
              <th>Selasa (23/06)</th>
              <th>Rabu (24/06)</th>
              <th>Kamis (25/06)</th>
              <th>Jumat (26/06)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada jadwal shift minggu ini</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftSchedule;
