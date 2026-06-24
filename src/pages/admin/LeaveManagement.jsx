import React, { useState, useEffect } from 'react';

const LeaveManagement = () => {
  const [requests, setRequests] = useState([]);
  const adminRole = localStorage.getItem('admin-role') || 'pro';
  const reqKey = adminRole === 'demo' ? 'demo-leave_requests' : 'leave_requests';

  useEffect(() => {
    const rawRequests = JSON.parse(localStorage.getItem(reqKey)) || [];
    setRequests(rawRequests);
  }, []);

  const handleApprove = (id) => {
    const updated = requests.map(req => req.id === id ? { ...req, status: 'Disetujui' } : req);
    setRequests(updated);
    localStorage.setItem(reqKey, JSON.stringify(updated));
  };

  const handleReject = (id) => {
    const updated = requests.map(req => req.id === id ? { ...req, status: 'Ditolak' } : req);
    setRequests(updated);
    localStorage.setItem(reqKey, JSON.stringify(updated));
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
              <th>Tipe</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Lampiran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? requests.map(req => (
              <tr key={req.id}>
                <td>{req.employeeName}</td>
                <td><span className={`status-badge badge-${req.type === 'Sakit' ? 'warning' : 'success'}`}>{req.type}</span></td>
                <td>{req.date}</td>
                <td>{req.reason}</td>
                <td>{req.attachment ? <a href="#">{req.attachment}</a> : '-'}</td>
                <td>
                  <span className={`status-badge badge-${req.status === 'Menunggu' ? 'warning' : req.status === 'Disetujui' ? 'success' : 'danger'}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  {req.status === 'Menunggu' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={() => handleApprove(req.id)} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Setujui</button>
                      <button className="btn-secondary" onClick={() => handleReject(req.id)} style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)'}}>Tolak</button>
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
