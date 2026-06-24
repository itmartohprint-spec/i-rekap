import React from 'react';

const LicenseManagement = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manajemen Lisensi</h2>
        <button className="btn-primary">Buat Lisensi Baru</button>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Lisensi Aktif</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>38</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Akan Kedaluwarsa (7 Hari)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>5</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lisensi Suspend / Mati</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>4</p>
        </div>
      </div>

      <div className="admin-table-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Daftar Tagihan & Lisensi</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kode Lisensi</th>
              <th>Perusahaan</th>
              <th>Paket</th>
              <th>Valid Sampai</th>
              <th>Status Pembayaran</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LIC-2026-001</td>
              <td>PT Angin Ribut</td>
              <td>Enterprise</td>
              <td>31 Des 2026</td>
              <td><span className="status-badge badge-success">Lunas</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Perpanjang</button></td>
            </tr>
            <tr>
              <td>LIC-2026-002</td>
              <td>CV Makmur Jaya</td>
              <td>Basic</td>
              <td>25 Jun 2026</td>
              <td><span className="status-badge badge-warning">Pending Invoice</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kirim Pengingat</button></td>
            </tr>
            <tr>
              <td>LIC-2026-003</td>
              <td>PT Sentosa Abadi</td>
              <td>Pro</td>
              <td>01 Jan 2026</td>
              <td><span className="status-badge badge-danger">Suspend</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Re-aktivasi</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LicenseManagement;
