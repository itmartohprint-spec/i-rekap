import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AttendanceForm from './AttendanceForm';
import { AlertTriangle } from 'lucide-react';

const SidakOverlay = () => {
  const [activeSidak, setActiveSidak] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const userId = localStorage.getItem('user-id');
  const licenseCode = localStorage.getItem('valid-license');

  useEffect(() => {
    if (!userId || !licenseCode) return;

    // Check immediately, then poll every 10 seconds
    checkSidak();
    const interval = setInterval(checkSidak, 10000);

    return () => clearInterval(interval);
  }, [userId, licenseCode]);

  const checkSidak = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    
    // 1. Fetch active announcements of type 'sidak' for today
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('license_code', licenseCode)
      .eq('type', 'sidak')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !announcements || announcements.length === 0) {
      return;
    }

    const sidak = announcements[0];

    // 2. Check if this sidak targets this user
    if (sidak.content === 'all' || sidak.content === userId) {
      
      // 3. Check if user already responded to this exact sidak request today
      // We can use local storage to track responded sidak IDs
      const respondedStr = localStorage.getItem(`sidak_responded_${userId}`) || '[]';
      const responded = JSON.parse(respondedStr);

      if (!responded.includes(sidak.id)) {
        // User needs to respond!
        setActiveSidak(sidak);
      } else {
        setActiveSidak(null);
      }
    } else {
      setActiveSidak(null);
    }
  };

  const handleSidakSubmit = () => {
    // Save to local storage that we responded to this sidak
    if (activeSidak) {
      const respondedStr = localStorage.getItem(`sidak_responded_${userId}`) || '[]';
      const responded = JSON.parse(respondedStr);
      responded.push(activeSidak.id);
      localStorage.setItem(`sidak_responded_${userId}`, JSON.stringify(responded));
    }
    
    setShowCamera(false);
    setActiveSidak(null);
    
    // trigger custom event just in case
    window.dispatchEvent(new Event('attendanceSubmitted'));
    alert('Terima kasih, foto Sidak Anda berhasil dikirim ke Pimpinan.');
  };

  if (!activeSidak) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: '#fff',
      textAlign: 'center'
    }}>
      {!showCamera ? (
        <div style={{
          background: '#ef4444',
          borderRadius: '20px',
          padding: '40px 20px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)',
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle size={64} color="#fff" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 15px 0' }}>PERHATIAN!</h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '30px' }}>
            Pimpinan sedang melakukan <b>Inspeksi Mendadak (SIDAK)</b>. Anda diwajibkan untuk mengirimkan foto Selfie + Lokasi GPS Anda saat ini juga!
          </p>
          <button 
            onClick={() => setShowCamera(true)}
            style={{
              background: '#fff',
              color: '#ef4444',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            📸 BUKA KAMERA SEKARANG
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '20px', overflow: 'hidden' }}>
          {/* Re-using AttendanceForm with type="sidak" */}
          <AttendanceForm 
            type="sidak" 
            onClose={handleSidakSubmit} // onClose acts as submit success callback here since AttendanceForm closes itself on success
          />
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default SidakOverlay;
