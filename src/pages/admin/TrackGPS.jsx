import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../../lib/supabaseClient';

// Function to create custom dynamic marker
const createCustomMarker = (log) => {
  const photo = log.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(log.employeeName) + '&background=0D8ABC&color=fff';
  const borderColor = log.status === 'Hadir' ? '#10b981' : '#ef4444';
  const animation = log.status === 'Hadir' ? '' : 'animation: pulse 2s infinite;';
  
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 60px; transform: translate(-15px, -15px);">
        <div style="background-image: url('${photo}'); background-size: cover; background-position: center; background-color: #fff; width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 0 10px rgba(0,0,0,0.3); ${animation}"></div>
        <div style="background: rgba(255,255,255,0.9); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2); text-align: center;">${log.employeeName}</div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const TrackGPS = () => {
  const [officeLocation, setOfficeLocation] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [logs, setLogs] = useState([]);

  const adminRole = localStorage.getItem('admin-role') || 'pro';
  const logsKey = adminRole === 'demo' ? 'demo-attendance_logs' : 'attendance_logs';

  useEffect(() => {
    fetchGPSLogs();
    const licenseCode = localStorage.getItem('valid-license');
    if (licenseCode) {
      const savedLat = localStorage.getItem(`office_lat_${licenseCode}`);
      const savedLng = localStorage.getItem(`office_lng_${licenseCode}`);
      const savedRadius = localStorage.getItem(`radius_meters_${licenseCode}`);
      
      if (savedLat && savedLng) {
        setOfficeLocation([parseFloat(savedLat), parseFloat(savedLng)]);
      } else {
        setOfficeLocation([-6.200000, 106.816666]);
      }
      
      if (savedRadius) {
        setRadiusMeters(parseInt(savedRadius));
      }
    } else {
      setOfficeLocation([-6.200000, 106.816666]);
    }
  }, []);

  const fetchGPSLogs = async () => {
    const licenseCode = localStorage.getItem('valid-license');
    if (adminRole === 'demo') {
      const rawLogs = JSON.parse(localStorage.getItem('demo-attendance_logs')) || [];
      setLogs(rawLogs.filter(log => log.location));
      return;
    }
    
    if (!licenseCode) return;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees (name)
      `)
      .eq('license_code', licenseCode)
      .eq('date', today)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const uniqueEmployees = new Set();
      const filteredData = data.filter(d => {
        if (uniqueEmployees.has(d.employee_id)) return false;
        uniqueEmployees.add(d.employee_id);
        return true;
      });

      // Map supabase data to expected format for markers
      const mappedLogs = filteredData.map(d => ({
        id: d.id,
        location: { lat: parseFloat(d.location_lat), lng: parseFloat(d.location_lng) },
        employeeName: d.employees?.name || d.employee_id,
        photo_url: d.photo_url,
        type: d.type || 'in',
        time: d.time_in || d.time_out || d.date,
        status: d.status
      }));
      setLogs(mappedLogs);
    }
  };

  return (
    <div>
      <style>
        {`
          .leaflet-container {
            z-index: 10;
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}
      </style>
      <h2 style={{ marginBottom: '2rem' }}>Lacak GPS Karyawan Live</h2>
      
      <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', height: '500px', overflow: 'hidden' }}>
        {officeLocation && (
          <MapContainer 
            key={officeLocation.join(',')}
            center={officeLocation} 
            zoom={15} 
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Radius Kantor */}
            <Circle 
              center={officeLocation} 
              radius={radiusMeters} 
              pathOptions={{ color: '#0062ff', fillColor: '#0062ff', fillOpacity: 0.1 }} 
            />

          {logs.map((log, index) => (
            <Marker 
              key={log.id || index} 
              position={[log.location.lat, log.location.lng]} 
              icon={createCustomMarker(log)}
            >
              <Popup>
                <strong>{log.employeeName}</strong><br/>
                Tipe: <span style={{textTransform: 'capitalize'}}>{log.type.replace('_', ' ')}</span><br/>
                Waktu: {log.time}
              </Popup>
            </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      
      <div className="admin-table-container" style={{ marginTop: '2rem' }}>
        <h3>Log Posisi Terbaru</h3>
        <table className="admin-table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Waktu</th>
              <th>Koordinat (Lat, Lng)</th>
              <th>Akurasi</th>
              <th>Status Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map(log => (
              <tr key={log.id}>
                <td>{log.employeeName}</td>
                <td>{log.time}</td>
                <td>{log.location.lat}, {log.location.lng}</td>
                <td>~5 meter</td>
                <td>
                  <span className={`status-badge badge-${log.status === 'Hadir' ? 'success' : 'danger'}`}>
                    {log.status === 'Hadir' ? 'Dalam Area' : 'Luar Area'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada log GPS terbaru</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrackGPS;
