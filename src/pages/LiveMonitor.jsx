import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, CheckCircle, Clock, XCircle, TrendingUp, Calendar, 
  Map as MapIcon, ClipboardList, CheckSquare, FileText,
  Check, X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../index.css'; // Global CSS

// Fix leaflet icon issue natively
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Function to create custom dynamic marker
const createCustomMarker = (log) => {
  const photo = log.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(log.employeeName) + '&background=0D8ABC&color=fff';
  const isLate = log.status === 'Terlambat' || log.status === 'late';
  const borderColor = isLate ? '#f59e0b' : '#10b981';
  const animation = isLate ? 'animation: pulse-late 2s infinite;' : '';
  
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 60px; transform: translate(-15px, -15px);">
        <div style="background-image: url('${photo}'); background-size: cover; background-position: center; background-color: #fff; width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 0 10px rgba(0,0,0,0.3); ${animation}"></div>
        <div style="background: rgba(255,255,255,0.9); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2); text-align: center; color: #333;">${log.employeeName}</div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const LiveMonitor = () => {
  const { licenseCode } = useParams();
  const navigate = useNavigate();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, logs, gps, leave

  // Data States
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [recentLogs, setRecentLogs] = useState([]); // limited for dashboard
  const [allLogs, setAllLogs] = useState([]); // for logs tab
  const [gpsLogs, setGpsLogs] = useState([]); // for gps tab
  const [leaveRequests, setLeaveRequests] = useState([]); // for leave tab
  
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Pimpinan Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [officeLocation, setOfficeLocation] = useState([-6.200000, 106.816666]);

  useEffect(() => {
    if (!licenseCode) {
      navigate('/');
      return;
    }
    
    // Live clock updater
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetchRealData();
    // Auto refresh data every 30 seconds
    const dataTimer = setInterval(fetchRealData, 30000);

    // Fetch office config
    const savedLat = localStorage.getItem(`office_lat_${licenseCode}`);
    const savedLng = localStorage.getItem(`office_lng_${licenseCode}`);
    if (savedLat && savedLng) {
      setOfficeLocation([parseFloat(savedLat), parseFloat(savedLng)]);
    }

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, [licenseCode, navigate]);

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Total Employees
      const { data: employees, count: empCount } = await supabase
        .from('employees')
        .select('name', { count: 'exact' })
        .eq('license_code', licenseCode);

      if (employees && employees.length > 0) {
        setCompanyName('Monitor Eksekutif');
      }
      const totalEmp = empCount || 0;

      // 2. Get Today's Attendance
      const today = new Date().toLocaleDateString('en-CA');
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          id, 
          employee_id, 
          date, 
          time_in,
          time_out,
          type,
          status,
          location_lat,
          location_lng,
          photo_url,
          employees (name)
        `)
        .eq('license_code', licenseCode)
        .eq('date', today)
        .order('created_at', { ascending: false });

      // Calculate stats based on today
      const todaysInLogs = attendanceData ? attendanceData.filter(log => log.type === 'in') : [];
      
      const presentEmployees = new Set(todaysInLogs.map(log => log.employee_id));
      const present = presentEmployees.size;
      const lateEmployees = new Set(todaysInLogs.filter(log => log.status === 'late' || log.status === 'Terlambat').map(log => log.employee_id));
      const late = lateEmployees.size;
      const absent = Math.max(0, totalEmp - present);

      setStats({
        totalEmployees: totalEmp,
        presentToday: present,
        lateToday: late,
        absentToday: absent
      });

      // Format logs
      if (attendanceData) {
        const formattedLogs = todaysInLogs.map(log => ({
          id: log.id,
          employeeName: log.employees ? log.employees.name : log.employee_id,
          time: log.time_in || log.time_out || '-',
          status: log.status,
          photo_url: log.photo_url,
          location: (log.location_lat && log.location_lng) ? { lat: parseFloat(log.location_lat), lng: parseFloat(log.location_lng) } : null
        }));
        setAllLogs(formattedLogs);
        setRecentLogs(formattedLogs.slice(0, 5)); // Dashboard limited logs

        // Unique GPS markers (latest in for each employee)
        const uniqueGPS = [];
        const seenGPS = new Set();
        formattedLogs.forEach(log => {
          if (log.location && !seenGPS.has(log.employeeName)) {
            seenGPS.add(log.employeeName);
            uniqueGPS.push(log);
          }
        });
        setGpsLogs(uniqueGPS);
      }

      // 3. Get Leave Requests (Pending)
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select(`*, employees(name)`)
        .eq('license_code', licenseCode)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (leaveData) {
        setLeaveRequests(leaveData);
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setIsLoading(false);
  };

  const handleUpdateLeave = async (id, newStatus) => {
    // Optimistic update
    setLeaveRequests(leaveRequests.filter(req => req.id !== id));
    
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Gagal memproses pengajuan: " + error.message);
      fetchRealData(); // refresh on fail
    }
  };

  // ----------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------

  const renderDashboard = () => (
    <>
      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
        
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: '#38bdf8', marginBottom: '5px' }}><Users size={24} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8' }}>Total Karyawan</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff' }}>{isLoading ? '-' : stats.totalEmployees}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: '#10b981', marginBottom: '5px' }}><CheckCircle size={24} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8' }}>Hadir (Hari Ini)</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff' }}>{isLoading ? '-' : stats.presentToday}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: '#f59e0b', marginBottom: '5px' }}><Clock size={24} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8' }}>Terlambat</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff' }}>{isLoading ? '-' : stats.lateToday}</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', marginBottom: '5px' }}><XCircle size={24} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#94a3b8' }}>Absen (Alpha)</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff' }}>{isLoading ? '-' : stats.absentToday}</div>
        </div>

      </div>

      {/* Recent Logs List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#f8fafc' }}>Presensi Masuk Terbaru</h3>
        <button onClick={() => setActiveTab('logs')} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.85rem' }}>Lihat Semua</button>
      </div>
      
      <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px', borderRadius: '15px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Memuat data realtime...</div>
        ) : recentLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img 
                    src={log.photo_url || `https://ui-avatars.com/api/?name=${log.employeeName}&background=0D8ABC&color=fff`} 
                    alt="avatar" 
                    style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#ffffff' }}>{log.employeeName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.time}</div>
                  </div>
                </div>
                <div>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    background: log.status === 'Terlambat' || log.status === 'late' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                    color: log.status === 'Terlambat' || log.status === 'late' ? '#fbbf24' : '#34d399'
                  }}>
                    {log.status === 'Terlambat' || log.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
            Belum ada karyawan yang absen hari ini.
          </div>
        )}
      </div>
    </>
  );

  const renderLogs = () => (
    <>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#f8fafc' }}>Daftar Hadir Hari Ini</h3>
      <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px', borderRadius: '15px' }}>
        {allLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allLogs.map(log => (
              <div key={log.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img 
                    src={log.photo_url || `https://ui-avatars.com/api/?name=${log.employeeName}&background=0D8ABC&color=fff`} 
                    alt="avatar" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#ffffff' }}>{log.employeeName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Jam Masuk: {log.time}</div>
                  </div>
                </div>
                <div>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    background: log.status === 'Terlambat' || log.status === 'late' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                    color: log.status === 'Terlambat' || log.status === 'late' ? '#fbbf24' : '#34d399'
                  }}>
                    {log.status === 'Terlambat' || log.status === 'late' ? 'Terlambat' : 'Hadir'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            Data kosong.
          </div>
        )}
      </div>
    </>
  );

  const renderGPS = () => (
    <>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#f8fafc' }}>Titik GPS Kehadiran</h3>
      <div style={{ 
        height: '60vh', 
        borderRadius: '15px', 
        overflow: 'hidden', 
        border: '2px solid #334155' 
      }}>
        <MapContainer center={officeLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {/* Office Marker */}
          <Marker position={officeLocation}>
            <Popup>Kantor Utama</Popup>
          </Marker>
          
          {/* Employee Markers */}
          {gpsLogs.map((log) => (
            <Marker 
              key={log.id} 
              position={[log.location.lat, log.location.lng]}
              icon={createCustomMarker(log)}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <img 
                    src={log.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeName)}`} 
                    alt={log.employeeName} 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '5px', objectFit: 'cover' }}
                  />
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#0f172a' }}>{log.employeeName}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Absen Jam: <b>{log.time}</b></p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: (log.status === 'Terlambat' || log.status === 'late') ? '#d97706' : '#059669' }}>
                    <b>{(log.status === 'Terlambat' || log.status === 'late') ? 'Terlambat' : 'Tepat Waktu'}</b>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>Klik ikon foto pada peta untuk melihat detail jam absen.</p>
    </>
  );

  const renderLeave = () => (
    <>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#f8fafc' }}>
        Pengajuan Izin & Cuti 
        {leaveRequests.length > 0 && (
          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px', verticalAlign: 'middle' }}>
            {leaveRequests.length} Menunggu
          </span>
        )}
      </h3>
      
      {leaveRequests.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {leaveRequests.map(req => (
            <div key={req.id} style={{ background: '#1e293b', border: '1px solid #334155', padding: '15px', borderRadius: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#ffffff' }}>{req.employees?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 'bold' }}>Pengajuan {req.type}</div>
                </div>
                <div style={{ background: '#334155', color: '#f8fafc', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '5px' }}>
                  {req.start_date} s/d {req.end_date}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '15px', background: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                "{req.reason}"
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleUpdateLeave(req.id, 'approved')}
                  style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Check size={16} /> Setujui
                </button>
                <button 
                  onClick={() => handleUpdateLeave(req.id, 'rejected')}
                  style={{ flex: 1, padding: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <X size={16} /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '30px 20px', borderRadius: '15px', textAlign: 'center' }}>
          <div style={{ color: '#10b981', marginBottom: '10px' }}><CheckCircle size={40} style={{ margin: '0 auto' }}/></div>
          <h4 style={{ color: '#ffffff', margin: '0 0 5px 0' }}>Semua Beres!</h4>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Tidak ada pengajuan izin, cuti, atau sakit yang menunggu persetujuan Anda saat ini.</p>
        </div>
      )}
    </>
  );

  return (
    <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ 
        background: '#0f172a', 
        minHeight: '100vh', 
        width: '100%', 
        maxWidth: '500px', 
        position: 'relative',
        color: '#f8fafc', 
        fontFamily: 'Inter, sans-serif', 
        paddingBottom: '80px',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}>
        
        {/* Header (Applies to all tabs) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center', padding: '20px 20px 0 20px' }}>
          <div style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '30px',
            fontWeight: 'bold',
            marginBottom: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            fontSize: '0.8rem'
          }}>
            <TrendingUp size={16} />
            {companyName}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p style={{ margin: 0, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', marginTop: '5px' }}>
            <Calendar size={12} /> 
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Main Content Area */}
        <div style={{ padding: '0 20px' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'gps' && renderGPS()}
          {activeTab === 'leave' && renderLeave()}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.7rem', color: '#64748b' }}>
          <p>Data diperbarui secara otomatis.</p>
        </div>

        {/* Bottom Navigation Bar */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: '#1e293b', 
          borderTop: '1px solid #334155',
          borderBottomLeftRadius: window.innerWidth > 500 ? '15px' : '0',
          borderBottomRightRadius: window.innerWidth > 500 ? '15px' : '0',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 10px',
          zIndex: 1000,
          boxShadow: '0 -4px 10px rgba(0,0,0,0.2)'
        }}>
          
          <div 
            onClick={() => setActiveTab('dashboard')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8' }}
          >
            <TrendingUp size={22} />
            <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal' }}>Dashboard</span>
          </div>

          <div 
            onClick={() => setActiveTab('logs')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'logs' ? '#38bdf8' : '#94a3b8' }}
          >
            <ClipboardList size={22} />
            <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'logs' ? 'bold' : 'normal' }}>Log Absen</span>
          </div>

          <div 
            onClick={() => setActiveTab('gps')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'gps' ? '#38bdf8' : '#94a3b8' }}
          >
            <MapIcon size={22} />
            <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'gps' ? 'bold' : 'normal' }}>Peta GPS</span>
          </div>

          <div 
            onClick={() => setActiveTab('leave')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', position: 'relative', color: activeTab === 'leave' ? '#38bdf8' : '#94a3b8' }}
          >
            <FileText size={22} />
            <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'leave' ? 'bold' : 'normal' }}>Pengajuan</span>
            {leaveRequests.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '50%', fontWeight: 'bold' }}>
                {leaveRequests.length}
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveMonitor;
