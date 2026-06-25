import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, Clock, DollarSign, Image } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

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

  const approveCompany = async (company) => {
    const { error } = await supabase.from('companies').update({ status: 'active' }).eq('id', company.id);
    if (!error) {
      alert('Perusahaan berhasil diverifikasi!');
      fetchCompanies();

      // Fitur Auto-Email via mailto
      const licenseCode = company.id ? `LIC-${company.id.toString().substring(0,6).toUpperCase()}` : 'LIC-NEW001';
      const subject = encodeURIComponent('Pendaftaran i-Rekap Berhasil Disetujui!');
      const body = encodeURIComponent(
        `Halo Tim HR ${company.name},\n\n` +
        `Pembayaran Anda telah kami terima dan lisensi akun perusahaan Anda sudah AKTIF.\n\n` +
        `Berikut adalah detail akses Anda:\n` +
        `URL Portal: https://i-rekap.com\n` +
        `Username Portal HR: admin\n` +
        `Kode Lisensi: ${licenseCode}\n\n` +
        `Silakan login dan lengkapi profil serta data karyawan Anda untuk mulai menggunakan aplikasi i-Rekap.\n\n` +
        `Terima kasih,\nTim i-Rekap`
      );
      
      window.location.href = `mailto:${company.email || ''}?subject=${subject}&body=${body}`;
    } else {
      alert('Gagal memverifikasi: ' + error.message);
    }
  };

  const totalCompanies = companies.length;
  const activeLicenses = companies.filter(c => c.status === 'active').length;
  const expiredLicenses = companies.filter(c => c.status === 'expired' || c.status === 'suspended').length;
  const monthlyRevenue = companies.reduce((acc, curr) => {
    if (curr.status === 'active') {
      return acc + (curr.plan === 'standar' ? 499000 : 999000);
    }
    return acc;
  }, 0);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard Manajemen Pelanggan</h2>
      
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-details">
            <h4>Total Tenant</h4>
            <p>{totalCompanies}</p>
          </div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h4>Lisensi Aktif</h4>
            <p>{activeLicenses}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h4>Lisensi Nonaktif</h4>
            <p>{expiredLicenses}</p>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h4>Pendapatan Bulanan</h4>
            <p>{formatRupiah(monthlyRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Daftar Lengkap Tenant & Lisensi</h3>
          <button className="btn-primary">Tambah Tenant Manual</button>
        </div>
        
        {isLoading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</p> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Perusahaan</th>
              <th>Admin / Kontak</th>
              <th>Kode Lisensi</th>
              <th>Paket</th>
              <th>Status</th>
              <th>Aksi / Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const licenseCode = company.id ? `LIC-${company.id.toString().substring(0,6).toUpperCase()}` : '-';
              
              return (
                <tr key={company.id}>
                  <td>
                    <strong>{company.name}</strong>
                  </td>
                  <td>
                    <div>{company.admin_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{company.email}</div>
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {licenseCode}
                    </code>
                  </td>
                  <td>
                    <div style={{ textTransform: 'capitalize' }}>{company.plan}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {company.plan === 'standar' ? 'Maks 50 Orang' : 'Maks 200 Orang'}
                    </div>
                  </td>
                  <td>
                    {company.status === 'active' ? (
                      <span className="status-badge badge-success">Aktif / Lunas</span>
                    ) : company.status === 'pending' ? (
                      <span className="status-badge badge-warning">Menunggu Validasi</span>
                    ) : (
                      <span className="status-badge badge-danger">{company.status}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {company.payment_proof && (
                        <button 
                          type="button"
                          className="btn-secondary" 
                          style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'}}
                          onClick={() => { setSelectedProof(company.payment_proof); setShowProofModal(true); }}
                        >
                          <Image size={14} /> Bukti Transfer
                        </button>
                      )}
                      
                      {company.status === 'pending' && (
                        <button 
                          type="button"
                          className="btn-primary" 
                          style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#10b981', border: 'none'}}
                          onClick={() => approveCompany(company)}
                        >
                          Setujui
                        </button>
                      )}

                      {company.status === 'active' && (
                        <button 
                          type="button"
                          className="btn-secondary" 
                          style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                        >
                          Kelola
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {companies.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data perusahaan terdaftar.</td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {showProofModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: '#0f172a' }}>Bukti Pembayaran</h3>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <img src={selectedProof} alt="Bukti" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowProofModal(false)} style={{ width: '100%' }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
