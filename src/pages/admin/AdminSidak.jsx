import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, Search, AlertCircle, Camera } from 'lucide-react';

const AdminSidak = () => {
  const [sidakLogs, setSidakLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const licenseCode = localStorage.getItem('valid-license');

  useEffect(() => {
    fetchSidakHistory();
  }, []);

  const fetchSidakHistory = async () => {
    setIsLoading(true);
    
    // We fetch attendance logs where type is 'sidak'
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id, 
        employee_id, 
        date, 
        time_in,
        location_lat,
        location_lng,
        photo_url,
        created_at,
        employees (name, department)
      `)
      .eq('license_code', licenseCode)
      .eq('type', 'sidak')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setSidakLogs(data);
    }
    
    setIsLoading(false);
  };

  const filteredLogs = sidakLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const name = log.employees?.name?.toLowerCase() || '';
    const date = log.date || '';
    return name.includes(search) || date.includes(search);
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Riwayat Sidak (Inspeksi Mendadak)</h2>
          <p>Pantau hasil foto dan lokasi karyawan dari perintah Sidak Pimpinan.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Search size={20} color="#64748b" style={{ marginRight: '10px' }} />
          <input 
            type="text" 
            placeholder="Cari nama karyawan atau YYYY-MM-DD..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
          />
        </div>
        <button className="btn-secondary" onClick={fetchSidakHistory} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Refresh
        </button>
      </div>

      <div className="glass-panel table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p>Memuat data riwayat sidak...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tanggal Sidak</th>
                <th>Karyawan</th>
                <th>Jam Merespons</th>
                <th>Lokasi GPS</th>
                <th>Foto Selfie</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>
                    <strong>{log.employees?.name}</strong><br/>
                    <small style={{ color: '#64748b' }}>{log.employees?.department}</small>
                  </td>
                  <td>
                    <span style={{ 
                      background: '#fee2e2', color: '#ef4444', 
                      padding: '4px 10px', borderRadius: '20px', 
                      fontWeight: 'bold', fontSize: '0.85rem' 
                    }}>
                      {log.time_in}
                    </span>
                  </td>
                  <td>
                    {log.location_lat && log.location_lng ? (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${log.location_lat},${log.location_lng}`}
                        target="_blank" rel="noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.85rem' }}
                      >
                        Buka di Maps
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tidak ada GPS</span>
                    )}
                  </td>
                  <td>
                    {log.photo_url ? (
                      <button 
                        onClick={() => setSelectedPhoto(log)}
                        style={{ 
                          background: '#f1f5f9', border: '1px solid #cbd5e1', 
                          padding: '6px 12px', borderRadius: '6px', 
                          display: 'flex', alignItems: 'center', gap: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        <Camera size={16} color="#64748b" /> Lihat Foto
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <Users size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p>Tidak ada riwayat sidak yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Selfie Sidak</h3>
              <button onClick={() => setSelectedPhoto(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <img src={selectedPhoto.photo_url} alt="Sidak Selfie" style={{ width: '100%', borderRadius: '8px' }} />
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <strong>{selectedPhoto.employees?.name}</strong>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{selectedPhoto.date} | {selectedPhoto.time_in}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidak;
