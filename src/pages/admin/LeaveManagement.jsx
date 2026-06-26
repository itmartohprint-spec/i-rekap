import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const LeaveManagement = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    type: 'izin',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return;
    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('license_code', licenseCode);
    if (data) setEmployees(data);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.start_date || !formData.end_date || !formData.reason) {
      alert("Harap lengkapi semua field!");
      return;
    }

    setIsSubmitting(true);
    const licenseCode = localStorage.getItem('valid-license');
    
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: formData.employee_id,
        license_code: licenseCode,
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        status: 'approved' // Auto approved since admin is creating it
      }])
      .select('*, employees(name)');

    if (!error && data) {
      alert("Pengajuan berhasil ditambahkan!");
      setShowForm(false);
      setRequests([data[0], ...requests]);
      setFormData({
        employee_id: '',
        type: 'izin',
        start_date: '',
        end_date: '',
        reason: ''
      });
    } else {
      alert("Gagal menambahkan pengajuan: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Izin, Cuti & Sakit</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Buat Pengajuan (Admin)</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--panel-bg)', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Buat Pengajuan Baru</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group">
              <label>Karyawan</label>
              <select className="form-input" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} required>
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipe Pengajuan</label>
              <select className="form-input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
                <option value="izin">Izin</option>
                <option value="cuti">Cuti</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal Mulai</label>
              <input type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Tanggal Selesai</label>
              <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Keterangan / Alasan</label>
              <textarea className="form-input" rows="3" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Tuliskan keterangan detail..." required></textarea>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Setujui'}
              </button>
            </div>

          </form>
        </div>
      )}

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
