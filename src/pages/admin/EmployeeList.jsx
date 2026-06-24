import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', nik: '', birthDate: '', religion: '', dept: '', position: '',
    address: '', whatsapp: '', password: '', dailySalary: '', overtimeRate: '',
    leaveQuota: '12', status: 'Aktif Bekerja', isMock: false
  });
  const [budiPhoto, setBudiPhoto] = useState('');
  const [budiPassword, setBudiPassword] = useState('*****');
  const [divisions, setDivisions] = useState([]);

  const loadBudiData = () => {
    const photo = localStorage.getItem('user-photo');
    if (photo) setBudiPhoto(photo);
    
    const pass = localStorage.getItem('user-password');
    if (pass) setBudiPassword(pass);
  };

  const adminRole = localStorage.getItem('admin-role') || 'pro';

  const loadEmployees = async () => {
    if (adminRole === 'demo') {
      const demoEmployees = JSON.parse(localStorage.getItem('demo-hr-employees')) || [];
      setEmployees(demoEmployees);
      return;
    }
    const { data, error } = await supabase.from('employees').select('*').order('created_at');
    if (data && !error) {
      const formattedData = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        nik: emp.nik,
        birthDate: emp.birth_date,
        religion: emp.religion,
        dept: emp.dept,
        address: emp.address,
        whatsapp: emp.whatsapp,
        password: emp.password,
        dailySalary: emp.daily_salary,
        overtimeRate: emp.overtime_rate,
        leaveQuota: emp.leave_quota,
        status: emp.status,
        isMock: emp.is_mock
      }));
      setEmployees(formattedData);
    }
  };

  const loadDivisions = async () => {
    if (adminRole === 'demo') {
      const demoDivisions = JSON.parse(localStorage.getItem('demo-divisions')) || [];
      setDivisions(demoDivisions);
      return;
    }
    const { data, error } = await supabase.from('divisions').select('*').order('name');
    if (data && !error) {
      setDivisions(data.map(d => d.name));
    }
  };

  useEffect(() => {
    loadBudiData();
    loadEmployees();
    loadDivisions();

    // Listen to custom event from UserDashboard (same window)
    window.addEventListener('userProfileUpdated', loadBudiData);
    
    // Listen to storage event (other tabs)
    window.addEventListener('storage', loadBudiData);

    return () => {
      window.removeEventListener('userProfileUpdated', loadBudiData);
      window.removeEventListener('storage', loadBudiData);
    };
  }, []);

  const handleAddClick = () => {
    setEditMode(false);
    setFormData({ 
      id: `EMP-00${employees.length + 1}`, name: '', nik: '', birthDate: '', religion: '', dept: '', position: '',
      address: '', whatsapp: '', password: '', dailySalary: '', overtimeRate: '',
      leaveQuota: '12', status: 'Aktif Bekerja', isMock: false
    });
    setShowModal(true);
  };

  const handleEditClick = (emp) => {
    setEditMode(true);
    setFormData(emp);
    setShowModal(true);
  };

  const handleAddDivision = async () => {
    const newDiv = window.prompt("Masukkan nama Divisi / Bagian baru:");
    if (newDiv && newDiv.trim() !== '') {
      const trimmed = newDiv.trim();
      if (!divisions.includes(trimmed)) {
        if (adminRole === 'demo') {
          const newDivs = [...divisions, trimmed];
          setDivisions(newDivs);
          localStorage.setItem('demo-divisions', JSON.stringify(newDivs));
          return;
        }
        const { error } = await supabase.from('divisions').insert([{ name: trimmed }]);
        if (!error) {
          setDivisions([...divisions, trimmed]);
        }
      }
      setFormData({...formData, dept: trimmed});
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (adminRole === 'demo') {
      let updated;
      if (editMode) {
        updated = employees.map(emp => emp.id === formData.id ? formData : emp);
      } else {
        updated = [...employees, formData];
      }
      setEmployees(updated);
      localStorage.setItem('demo-hr-employees', JSON.stringify(updated));
      setShowModal(false);
      return;
    }

    const dbPayload = {
      id: formData.id,
      name: formData.name,
      nik: formData.nik,
      birth_date: formData.birthDate || null,
      religion: formData.religion,
      dept: formData.dept,
      address: formData.address,
      whatsapp: formData.whatsapp,
      password: formData.password,
      daily_salary: formData.dailySalary ? parseFloat(formData.dailySalary) : null,
      overtime_rate: formData.overtimeRate ? parseFloat(formData.overtimeRate) : null,
      leave_quota: formData.leaveQuota ? parseInt(formData.leaveQuota) : 12,
      status: formData.status,
      is_mock: formData.isMock
    };

    if (editMode) {
      const { error } = await supabase.from('employees').update(dbPayload).eq('id', formData.id);
      if (!error) {
        setEmployees(employees.map(emp => emp.id === formData.id ? formData : emp));
        setShowModal(false);
      } else {
        alert("Gagal mengupdate data: " + error.message);
      }
    } else {
      const { error } = await supabase.from('employees').insert([dbPayload]);
      if (!error) {
        setEmployees([...employees, formData]);
        setShowModal(false);
      } else {
        alert("Gagal menyimpan data: " + error.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Daftar Karyawan</h2>
        <button className="btn-primary" onClick={handleAddClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Tambah Karyawan
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foto</th>
              <th>Nama Karyawan</th>
              <th>Departemen</th>
              <th>Posisi</th>
              <th>Password</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 'bold', color: '#64748b' }}>
                    {emp.isMock && budiPhoto ? (
                      <img src={budiPhoto} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      emp.name.charAt(0)
                    )}
                  </div>
                </td>
                <td>{emp.name}</td>
                <td>{emp.dept}</td>
                <td>{emp.position}</td>
                <td style={{ fontFamily: 'monospace', color: emp.isMock && budiPassword !== '*****' ? '#0f172a' : '#94a3b8' }}>
                  {emp.isMock ? budiPassword : '*****'}
                </td>
                <td><span className={`status-badge badge-${emp.status === 'Aktif' ? 'success' : 'danger'}`}>{emp.status}</span></td>
                <td><button className="btn-secondary" onClick={() => handleEditClick(emp)} style={{padding: '0.25rem 0.75rem', fontSize: '0.85rem'}}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ background: 'white', width: '100%', maxWidth: '900px', padding: '2rem', borderRadius: '16px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              {editMode ? 'Edit Data Karyawan' : 'Tambah Data Karyawan Baru'}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>ID Karyawan (Untuk Login)</label>
                    <input type="text" className="form-input" required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="Contoh: EMP-004" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Nama Lengkap</label>
                    <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama sesuai KTP" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>No. KTP (NIK)</label>
                    <input type="text" className="form-input" value={formData.nik || ''} onChange={e => setFormData({...formData, nik: e.target.value})} placeholder="16 Digit NIK" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Tanggal Lahir</label>
                    <input type="date" className="form-input" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Agama</label>
                    <select className="form-input" value={formData.religion || ''} onChange={e => setFormData({...formData, religion: e.target.value})}>
                      <option value="">Pilih Agama</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ fontWeight: 600, color: '#334155' }}>Divisi / Bagian</label>
                      <button type="button" onClick={handleAddDivision} style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', padding: '0.1rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#0062ff', fontWeight: 600 }}>+ Tambah Divisi</button>
                    </div>
                    <select className="form-input" required value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>
                      <option value="">Pilih Divisi</option>
                      {divisions.map((div, idx) => (
                        <option key={idx} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Alamat Lengkap</label>
                    <textarea className="form-input" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat domisili saat ini" style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>No. WhatsApp</label>
                    <input type="text" className="form-input" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="Contoh: 081234567890" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Password Akun (Untuk Login)</label>
                    <input type="text" className="form-input" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Minimal 6 karakter" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Gaji Harian (Rp)</label>
                    <input type="number" className="form-input" value={formData.dailySalary || ''} onChange={e => setFormData({...formData, dailySalary: e.target.value})} placeholder="Contoh: 150000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Tarif Lembur (Rp/Jam)</label>
                    <input type="number" className="form-input" value={formData.overtimeRate || ''} onChange={e => setFormData({...formData, overtimeRate: e.target.value})} placeholder="Contoh: 20000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Jatah Cuti Tahunan (Hari)</label>
                    <input type="number" className="form-input" value={formData.leaveQuota || '12'} onChange={e => setFormData({...formData, leaveQuota: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Status Karyawan</label>
                    <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Aktif Bekerja">Aktif Bekerja</option>
                      <option value="Non-Aktif">Non-Aktif</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '8px' }}>
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
