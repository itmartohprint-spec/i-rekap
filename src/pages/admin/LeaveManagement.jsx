import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const LeaveManagement = () => {
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
      .from('leave_requests')
      .select(`
        *,
        employees (name)
      `)
      .eq('license_code', licenseCode)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leave requests:', error);
    } else if (data) {
      setRequests(data);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } else {
      alert("Gagal mengupdate status: " + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Izin, Cuti & Sakit</h2>
        <button className="btn-primary">Buat Pengajuan (Admin)</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Mulai</th>
              <th>Sampai</th>
              <th>Keterangan</th>
              <th>Lampiran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
              </tr>
            ) : requests.length > 0 ? requests.map(req => (
              <tr key={req.id}>
                <td>{req.employees ? req.employees.name : req.employee_id}</td>
                <td>{req.start_date}</td>
                <td>{req.end_date}</td>
                <td>{req.reason}</td>
                <td>{req.attachment_url ? <a href="#">{req.attachment_url}</a> : '-'}</td>
                <td>
                  <span className={`status-badge badge-${req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'danger'}`}>
                    {req.status === 'pending' ? 'Menunggu' : req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                  </span>
                </td>
                <td>
                  {req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => updateStatus(req.id, 'approved')} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Setujui</button>
                      <button className="btn-secondary" onClick={() => updateStatus(req.id, 'rejected')} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)'}}>Tolak</button>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada pengajuan izin/cuti terbaru</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveManagement;
