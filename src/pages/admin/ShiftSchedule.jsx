import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Clock, Check, X, Edit2 } from 'lucide-react';

const ShiftSchedule = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Shift Management State
  const [masterShifts, setMasterShifts] = useState([]);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShift, setNewShift] = useState({ name: '', startTime: '08:00', endTime: '17:00' });
  const [employeeShifts, setEmployeeShifts] = useState({});
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [editShiftData, setEditShiftData] = useState({ name: '', startTime: '', endTime: '' });

  const licenseCode = localStorage.getItem('valid-license');

  useEffect(() => {
    if (licenseCode) {
      loadLocalData();
      fetchEmployees();
    } else {
      setIsLoading(false);
    }
  }, [licenseCode]);

  const loadLocalData = () => {
    const savedShifts = localStorage.getItem(`master_shifts_${licenseCode}`);
    if (savedShifts) {
      setMasterShifts(JSON.parse(savedShifts));
    } else {
      // Default shift
      const defaultShifts = [{ id: 'default', name: 'Shift Reguler (Pagi)', startTime: '08:00', endTime: '17:00' }];
      setMasterShifts(defaultShifts);
      localStorage.setItem(`master_shifts_${licenseCode}`, JSON.stringify(defaultShifts));
    }

    const savedEmpShifts = localStorage.getItem(`employee_shifts_${licenseCode}`);
    if (savedEmpShifts) {
      setEmployeeShifts(JSON.parse(savedEmpShifts));
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name')
        .eq('license_code', licenseCode)
        .order('name', { ascending: true });

      if (data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
    setIsLoading(false);
  };

  const handleAddShift = () => {
    if (!newShift.name) return alert("Nama shift harus diisi!");
    
    const shift = {
      id: Date.now().toString(),
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime
    };

    const updatedShifts = [...masterShifts, shift];
    setMasterShifts(updatedShifts);
    localStorage.setItem(`master_shifts_${licenseCode}`, JSON.stringify(updatedShifts));
    
    setNewShift({ name: '', startTime: '08:00', endTime: '17:00' });
    setShowAddShift(false);
  };

  const handleDeleteShift = (id) => {
    if (id === 'default') return alert("Shift Reguler bawaan tidak dapat dihapus!");
    
    const isUsed = Object.values(employeeShifts).includes(id);
    if (isUsed && !window.confirm("Shift ini sedang digunakan oleh beberapa karyawan. Yakin ingin menghapus? (Karyawan akan kembali ke Shift Reguler)")) {
      return;
    }

    const updatedShifts = masterShifts.filter(s => s.id !== id);
    setMasterShifts(updatedShifts);
    localStorage.setItem(`master_shifts_${licenseCode}`, JSON.stringify(updatedShifts));

    if (isUsed) {
      const newEmpShifts = { ...employeeShifts };
      Object.keys(newEmpShifts).forEach(empId => {
        if (newEmpShifts[empId] === id) {
          newEmpShifts[empId] = 'default';
        }
      });
      setEmployeeShifts(newEmpShifts);
      localStorage.setItem(`employee_shifts_${licenseCode}`, JSON.stringify(newEmpShifts));
    }
  };

  const handleAssignShift = (employeeId, shiftId) => {
    const updated = { ...employeeShifts, [employeeId]: shiftId };
    setEmployeeShifts(updated);
    localStorage.setItem(`employee_shifts_${licenseCode}`, JSON.stringify(updated));
  };

  const handleStartEdit = (shift) => {
    setEditingShiftId(shift.id);
    setEditShiftData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
  };

  const handleUpdateShift = () => {
    if (!editShiftData.name) return alert("Nama shift harus diisi!");
    
    const updatedShifts = masterShifts.map(s => {
      if (s.id === editingShiftId) {
        return { ...s, name: editShiftData.name, startTime: editShiftData.startTime, endTime: editShiftData.endTime };
      }
      return s;
    });
    
    setMasterShifts(updatedShifts);
    localStorage.setItem(`master_shifts_${licenseCode}`, JSON.stringify(updatedShifts));
    setEditingShiftId(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Manajemen Jadwal Shift</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Atur tipe shift (jam kerja) dan tetapkan untuk masing-masing karyawan secara fleksibel.</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
        {/* Master Shift Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-color)" />
              Daftar Master Shift
            </h3>
            <button className="btn-primary" onClick={() => setShowAddShift(!showAddShift)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              {showAddShift ? <X size={16} /> : <Plus size={16} />}
              {showAddShift ? 'Batal' : 'Tambah Shift Baru'}
            </button>
          </div>

          {showAddShift && (
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Nama Shift</label>
                <input type="text" className="form-input" placeholder="Misal: Shift Malam" value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '1 1 100px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Jam Masuk</label>
                <input type="time" className="form-input" value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '1 1 100px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Jam Keluar</label>
                <input type="time" className="form-input" value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})} />
              </div>
              <button className="btn-primary" onClick={handleAddShift} style={{ background: 'var(--success-color)', height: '42px', padding: '0 1.5rem' }}>
                Simpan
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {masterShifts.map(shift => (
              <div key={shift.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', width: '250px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {editingShiftId === shift.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input type="text" className="form-input" style={{ margin: 0, padding: '0.3rem', fontSize: '0.9rem' }} value={editShiftData.name} onChange={e => setEditShiftData({...editShiftData, name: e.target.value})} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="time" className="form-input" style={{ margin: 0, padding: '0.3rem', fontSize: '0.85rem' }} value={editShiftData.startTime} onChange={e => setEditShiftData({...editShiftData, startTime: e.target.value})} />
                      <input type="time" className="form-input" style={{ margin: 0, padding: '0.3rem', fontSize: '0.85rem' }} value={editShiftData.endTime} onChange={e => setEditShiftData({...editShiftData, endTime: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={handleUpdateShift} className="btn-primary" style={{ padding: '0.3rem', flex: 1, fontSize: '0.85rem' }}>Simpan</button>
                      <button onClick={() => setEditingShiftId(null)} className="btn-secondary" style={{ padding: '0.3rem', flex: 1, fontSize: '0.85rem' }}>Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{shift.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                      <span>Masuk: <strong>{shift.startTime}</strong></span>
                      <span>Keluar: <strong>{shift.endTime}</strong></span>
                    </div>
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => handleStartEdit(shift)}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                        title="Edit Shift"
                      >
                        <Edit2 size={16} />
                      </button>
                      {shift.id !== 'default' && (
                        <button 
                          onClick={() => handleDeleteShift(shift.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Hapus Shift"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Penugasan Shift Karyawan</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Status</th>
              <th>Pilihan Shift Kerja</th>
              <th>Jam Berlaku</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data karyawan...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data karyawan. Silakan tambah karyawan di menu Data Karyawan terlebih dahulu.</td>
              </tr>
            ) : (
              employees.map(emp => {
                const currentShiftId = employeeShifts[emp.id] || 'default';
                const currentShiftObj = masterShifts.find(s => s.id === currentShiftId) || masterShifts[0];

                return (
                  <tr key={emp.id}>
                    <td>
                      <strong>{emp.name}</strong>
                    </td>
                    <td><span className="status-badge badge-success">Aktif</span></td>
                    <td>
                      <select 
                        className="form-input" 
                        style={{ padding: '0.4rem', fontSize: '0.9rem', width: 'auto', margin: 0, minWidth: '180px' }}
                        value={currentShiftId}
                        onChange={(e) => handleAssignShift(emp.id, e.target.value)}
                      >
                        {masterShifts.map(shift => (
                          <option key={shift.id} value={shift.id}>{shift.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                        {currentShiftObj.startTime} - {currentShiftObj.endTime}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftSchedule;
