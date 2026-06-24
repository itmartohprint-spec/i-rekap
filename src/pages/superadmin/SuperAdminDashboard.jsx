import React from 'react';
import { Building2, CheckCircle, Clock, DollarSign } from 'lucide-react';

const SuperAdminDashboard = () => {
  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Ringkasan SaaS i-rekap</h2>
      
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-details">
            <h4>Total Perusahaan</h4>
            <p>42</p>
          </div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h4>Lisensi Aktif</h4>
            <p>38</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h4>Lisensi Kedaluwarsa</h4>
            <p>4</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h4>Pendapatan Bulanan</h4>
            <p>Rp 45.5M</p>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Pendaftaran Perusahaan Terbaru</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Perusahaan</th>
              <th>Kode Tenant</th>
              <th>Paket Langganan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PT Angin Ribut</td>
              <td>ANGIN</td>
              <td>Enterprise (500 User)</td>
              <td><span className="status-badge badge-success">Aktif</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
            <tr>
              <td>CV Makmur Jaya</td>
              <td>MAKMUR</td>
              <td>Basic (50 User)</td>
              <td><span className="status-badge badge-warning">Menunggu Pembayaran</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
            <tr>
              <td>PT Sentosa Abadi</td>
              <td>SENTOSA</td>
              <td>Pro (200 User)</td>
              <td><span className="status-badge badge-danger">Kedaluwarsa</span></td>
              <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
