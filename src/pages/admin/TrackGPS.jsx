import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Map Markers to avoid Vite image path issues and look more modern
const officeIcon = L.divIcon({
  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const dangerIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const TrackGPS = () => {
  const [officeLocation, setOfficeLocation] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(50);
  const [logs, setLogs] = useState([]);

  const adminRole = localStorage.getItem('admin-role') || 'pro';
  const logsKey = adminRole === 'demo' ? 'demo-attendance_logs' : 'attendance_logs';

  useEffect(() => {
    const rawLogs = JSON.parse(localStorage.getItem(logsKey)) || [];
    setLogs(rawLogs.filter(log => log.location));
    
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
              icon={log.status === 'Hadir' ? officeIcon : dangerIcon}
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
