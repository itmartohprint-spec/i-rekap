import React from 'react';

const CompanyList = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Daftar Perusahaan (Tenant)</h2>
        <button className="btn-primary">Tambah Perusahaan Baru</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Tenant</th>
              <th>Nama Perusahaan</th>
              <th>Kontak / Email</th>
              <th>Total Karyawan</th>
              <th>Status Lisensi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ANGIN-001</td>
              <td>PT Angin Ribut</td>
              <td>admin@anginribut.com</td>
              <td>150</td>
              <td><span className="status-badge badge-success">Aktif</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
            <tr>
              <td>MAKMUR-002</td>
              <td>CV Makmur Jaya</td>
              <td>hr@makmurjaya.co.id</td>
              <td>45</td>
              <td><span className="status-badge badge-warning">Menunggu Pembayaran</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
            <tr>
              <td>SENTOSA-003</td>
              <td>PT Sentosa Abadi</td>
              <td>owner@sentosa.com</td>
              <td>120</td>
              <td><span className="status-badge badge-danger">Kedaluwarsa</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;
