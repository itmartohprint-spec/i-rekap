import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CashAdvance = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cash_advances')
      .select(`
        *,
        employees (name)
      `)
      .eq('license_code', licenseCode)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cash advances:', error);
    } else if (data) {
      setRequests(data);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('cash_advances')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } else {
      alert("Gagal mengupdate status: " + error.message);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const totalPinjamanAktif = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manajemen Kasbon</h2>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Pinjaman Disetujui</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{formatRupiah(totalPinjamanAktif)}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Kasbon Menunggu Approval</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>{pendingCount} Pengajuan</p>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Nominal</th>
              <th>Keterangan / Metode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : requests.length > 0 ? requests.map(req => (
              <tr key={req.id}>
                <td>{req.employees ? req.employees.name : req.employee_id}</td>
                <td style={{ fontWeight: 600 }}>{formatRupiah(req.amount)}</td>
                <td>{req.reason}</td>
                <td>
                  <span className={`status-badge badge-${req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'danger'}`}>
                    {req.status === 'pending' ? 'Menunggu' : req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </span>
                </td>
                <td>
                  {req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => updateStatus(req.id, 'approved')} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Approve</button>
                      <button className="btn-secondary" onClick={() => updateStatus(req.id, 'rejected')} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)'}}>Tolak</button>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada pengajuan kasbon terbaru</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashAdvance;
