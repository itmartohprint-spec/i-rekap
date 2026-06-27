import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, Megaphone, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const UserInfo = () => {
  const [infoData, setInfoData] = useState([]);

  const fetchSupabaseNotifications = async () => {
    const employeeId = localStorage.getItem('user-id');
    const licenseCode = localStorage.getItem('valid-license');
    if (!employeeId || !licenseCode) return [];

    let notifications = [];

    // Fetch Kasbon
    const { data: kasbonData } = await supabase
      .from('cash_advances')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('employee_id', employeeId)
      .neq('status', 'pending');

    if (kasbonData) {
      kasbonData.forEach(kasbon => {
        const isApproved = kasbon.status === 'approved' || kasbon.status === 'Disetujui';
        const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(kasbon.amount);
        notifications.push({
          id: `kasbon-${kasbon.id}`,
          type: isApproved ? 'info' : 'important',
          title: `Pengajuan Kasbon ${isApproved ? 'Disetujui' : 'Ditolak'}`,
          date: new Date(kasbon.created_at || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
          content: `Pengajuan kasbon Anda sebesar ${formattedAmount} telah ${isApproved ? 'disetujui' : 'ditolak'} oleh Admin.`,
          timestamp: new Date(kasbon.created_at || Date.now()).getTime()
        });
      });
    }

    // Fetch Cuti/Izin
    const { data: leaveData } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('employee_id', employeeId)
      .neq('status', 'pending');

    if (leaveData) {
      leaveData.forEach(leave => {
        const isApproved = leave.status === 'approved' || leave.status === 'Disetujui';
        let typeLabel = "Cuti/Izin";
        if (leave.type === 'izin') typeLabel = 'Izin';
        if (leave.type === 'sakit') typeLabel = 'Sakit';
        if (leave.reason?.includes('Cuti')) typeLabel = 'Cuti';
        
        notifications.push({
          id: `leave-${leave.id}`,
          type: isApproved ? 'info' : 'important',
          title: `Pengajuan ${typeLabel} ${isApproved ? 'Disetujui' : 'Ditolak'}`,
          date: new Date(leave.created_at || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
          content: `Pengajuan ${typeLabel.toLowerCase()} Anda untuk tanggal ${leave.start_date} telah ${isApproved ? 'disetujui' : 'ditolak'} oleh Admin.`,
          timestamp: new Date(leave.created_at || Date.now()).getTime()
        });
      });
    }

    // Sort by newest first
    notifications.sort((a, b) => b.timestamp - a.timestamp);
    return notifications;
  };

  const loadAnnouncements = async () => {
    const dynamicData = JSON.parse(localStorage.getItem('hr-announcements') || '[]');
    const dbNotifications = await fetchSupabaseNotifications();
    
    setInfoData([...dbNotifications, ...dynamicData]);
  };

  useEffect(() => {
    loadAnnouncements();

    window.addEventListener('hrAnnouncementSent', loadAnnouncements);
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
