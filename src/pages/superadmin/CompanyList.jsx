import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CompanyList = () => {
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
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data perusahaan terdaftar.</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.id || '-'}</td>
                  <td>{company.name}</td>
                  <td>{company.email}</td>
                  <td>{company.plan === 'standar' ? 'Maks 50' : 'Maks 200'}</td>
                  <td>
                    {company.status === 'active' ? (
                      <span className="status-badge badge-success">Aktif</span>
                    ) : company.status === 'pending' ? (
                      <span className="status-badge badge-warning">Menunggu Pembayaran</span>
                    ) : (
                      <span className="status-badge badge-danger">{company.status}</span>
                    )}
                  </td>
                  <td><button className="btn-secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Kelola</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;
