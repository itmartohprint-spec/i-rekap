import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const LicenseManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching companies:', error);
    } else {
      setCompanies(data || []);
    }
    setIsLoading(false);
  };

  const activeLicenses = companies.filter(c => c.status === 'active').length;
  const expiringLicenses = 0; // Placeholder until expiry logic is added
  const suspendedLicenses = companies.filter(c => c.status === 'suspended' || c.status === 'inactive' || c.status === 'expired').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manajemen Lisensi</h2>
        <button className="btn-primary">Buat Lisensi Baru</button>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Lisensi Aktif</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{activeLicenses}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Akan Kedaluwarsa (7 Hari)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>{expiringLicenses}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lisensi Suspend / Mati</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>{suspendedLicenses}</p>
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
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data lisensi/perusahaan.</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.id ? `LIC-${company.id.toString().substring(0,6).toUpperCase()}` : '-'}</td>
                  <td>{company.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{company.plan}</td>
                  <td>-</td>
                  <td>
                    {company.status === 'active' ? (
                      <span className="status-badge badge-success">Lunas</span>
                    ) : company.status === 'pending' ? (
                      <span className="status-badge badge-warning">Pending Invoice</span>
                    ) : (
                      <span className="status-badge badge-danger">Suspend</span>
                    )}
                  </td>
                  <td>
                    {company.status === 'active' ? (
                      <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Perpanjang</button>
                    ) : company.status === 'pending' ? (
                      <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kirim Pengingat</button>
                    ) : (
                      <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Re-aktivasi</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LicenseManagement;
