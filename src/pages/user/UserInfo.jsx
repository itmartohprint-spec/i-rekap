import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, Megaphone, Clock } from 'lucide-react';

const UserInfo = () => {
  const [infoData, setInfoData] = useState([]);

  const loadAnnouncements = () => {
    // Default mock data
    const defaultData = [
      {
        id: 1,
        type: 'important',
        title: 'Pemeliharaan Sistem Server',
        date: '24 Juni 2026',
        content: 'Akan dilakukan pemeliharaan server pada pukul 23:00 - 02:00 WIB. Fitur absensi tetap bisa digunakan dalam mode offline dan akan sinkron otomatis.',
      },
      {
        id: 2,
        type: 'info',
        title: 'Jadwal Libur Idul Adha',
        date: '15 Juni 2026',
        content: 'Diberitahukan kepada seluruh karyawan bahwa libur nasional jatuh pada hari Senin-Rabu. Kantor akan kembali beroperasi normal pada hari Kamis.',
      },
      {
        id: 3,
        type: 'announcement',
        title: 'Pengingat Aturan Seragam Baru',
        date: '10 Juni 2026',
        content: 'Mengingatkan kembali bahwa mulai Senin depan, seragam batik wajib dikenakan setiap hari Jumat.',
      }
    ];

    const dynamicData = JSON.parse(localStorage.getItem('hr-announcements') || '[]');
    setInfoData([...dynamicData, ...defaultData]);
  };

  useEffect(() => {
    loadAnnouncements();

    // Listen to custom event (same window)
    window.addEventListener('hrAnnouncementSent', loadAnnouncements);
    
    // Listen to storage event (other tabs)
    window.addEventListener('storage', loadAnnouncements);

    return () => {
      window.removeEventListener('hrAnnouncementSent', loadAnnouncements);
      window.removeEventListener('storage', loadAnnouncements);
    };
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'important': return <AlertTriangle size={20} color="#dc2626" />;
      case 'announcement': return <Megaphone size={20} color="#d97706" />;
      case 'info': default: return <Info size={20} color="#2563eb" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'important': return '#fee2e2';
      case 'announcement': return '#fef3c7';
      case 'info': default: return '#dbeafe';
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '0.8rem', borderRadius: '14px', color: 'white' }}>
          <Bell size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>Pusat Informasi</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Pesan & Pengumuman HR</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
        {infoData.map((item) => (
          <div key={item.id} style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '1.2rem', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            border: '1px solid #f1f5f9',
            borderLeft: `4px solid ${item.type === 'important' ? '#dc2626' : item.type === 'announcement' ? '#d97706' : '#2563eb'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: getBgColor(item.type), padding: '0.6rem', borderRadius: '10px' }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.3 }}>{item.title}</h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} /> {item.date}
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  {item.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserInfo;
