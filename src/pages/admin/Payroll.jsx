import React from 'react';

const Payroll = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Penggajian & Lembur</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-input" style={{ width: 'auto' }}>
            <option>Juni 2026</option>
            <option>Mei 2026</option>
          </select>
          <button className="btn-primary">Generate Payroll</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Gaji Pokok</th>
              <th>Total Lembur (Jam)</th>
              <th>Potongan (Kasbon/Telat)</th>
              <th>Total Diterima</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data penggajian</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
