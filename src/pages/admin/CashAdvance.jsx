import React from 'react';

const CashAdvance = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manajemen Kasbon</h2>
        <button className="btn-primary">Catat Kasbon Baru</button>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Pinjaman Aktif</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Rp 12.500.000</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Kasbon Menunggu Approval</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>2 Pengajuan</p>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Karyawan</th>
              <th>Nominal</th>
              <th>Tenor / Potongan per Bulan</th>
              <th>Sisa Hutang</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>15 Jun 2026</td>
              <td>Siti Aminah</td>
              <td>Rp 2.000.000</td>
              <td>2 Bulan (Rp 1.000.000)</td>
              <td>Rp 2.000.000</td>
              <td><span className="status-badge badge-success">Berjalan</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Detail</button></td>
            </tr>
            <tr>
              <td>23 Jun 2026</td>
              <td>Joko Widodo</td>
              <td>Rp 500.000</td>
              <td>1 Bulan (Rp 500.000)</td>
              <td>Rp 500.000</td>
              <td><span className="status-badge badge-warning">Menunggu</span></td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Approve</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashAdvance;
