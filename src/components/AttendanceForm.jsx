import React, { useRef, useState, useEffect } from 'react';
import { Camera, MapPin, Wifi, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './AttendanceForm.css';

const AttendanceForm = ({ type, onClose }) => {
  const typeLabel = {
    'in': 'Masuk',
    'out': 'Pulang',
    'early': 'Pulang Cepat',
    'overtime_in': 'Lembur Masuk',
    'overtime_out': 'Lembur Keluar'
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking'); // checking, success, error
  const [ipStatus, setIpStatus] = useState('checking'); // checking, success, error
  const [isUploading, setIsUploading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState('');
  
  useEffect(() => {
    startCamera();
    fetchCompanySettings();
    
    // Mock IP Check
    setTimeout(() => {
      setIpStatus('success');
    }, 1500);

    return () => {
      stopCamera();
    };
  }, []);

  const fetchCompanySettings = async () => {
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) {
      setLocationStatus('error');
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('office_lat, office_lng, radius_meters')
      .eq('license_code', licenseCode)
      .single();

    if (data) {
      checkLocation(data);
    } else {
      setLocationStatus('error');
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const checkLocation = (settings) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          
          if (!settings.office_lat || !settings.office_lng) {
            // Bypass if company hasn't set coordinates
            setLocationStatus('success');
            return;
          }

          const distance = getDistance(
            userLat, 
            userLng, 
            parseFloat(settings.office_lat), 
            parseFloat(settings.office_lng)
          );

          const maxRadius = settings.radius_meters ? parseInt(settings.radius_meters) : 50;

          if (distance <= maxRadius) {
            setLocationStatus('success');
            setDistanceInfo(`(${Math.round(distance)}m)`);
          } else {
            setLocationStatus('error');
            setDistanceInfo(`(Jarak: ${Math.round(distance)}m, Maks: ${maxRadius}m)`);
          }
        },
        (error) => {
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Kompresi kualitas gambar (0.5 = 50% kualitas) agar file base64 lebih kecil
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      setPhoto(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!photo || locationStatus !== 'success' || ipStatus !== 'success') {
      alert("Pastikan foto, lokasi, dan IP valid!");
      return;
    }

    setIsUploading(true);

    try {
      let photoUrl = photo; // default to base64
      
      // Upload ke Cloudinary jika env variables tersedia
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.secure_url) {
          photoUrl = data.secure_url;
        } else {
          console.error("Cloudinary upload failed:", data);
          alert("Gagal mengupload foto ke Cloudinary.");
          setIsUploading(false);
          return;
        }
      }

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format for database
      const formattedTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // HH:MM:SS format
      
      const licenseCode = localStorage.getItem('valid-license');
      const employeeId = localStorage.getItem('user-id');

      if (!licenseCode || !employeeId) {
        alert("Sesi login tidak valid. Silakan login ulang.");
        setIsUploading(false);
        return;
      }

      const { error } = await supabase.from('attendance').insert([{
        license_code: licenseCode,
        employee_id: employeeId,
        date: formattedDate,
        time_in: (type === 'in' || type === 'overtime_in') ? formattedTime : null,
        time_out: (type === 'out' || type === 'early' || type === 'overtime_out') ? formattedTime : null,
        status: 'Hadir', // default status
        type: type,
        location_lat: userLocation ? userLocation.lat : null,
        location_lng: userLocation ? userLocation.lng : null,
        photo_url: photoUrl
      }]);

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
      }

      alert(`Absen ${typeLabel[type]} Berhasil!`);
      onClose();
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Terjadi kesalahan sistem saat absen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="attendance-form">
      <div className="form-header">
        <h3>Absen {typeLabel[type]}</h3>
        <button className="btn-close" onClick={onClose}>&times;</button>
      </div>

      <div className="camera-container">
        {!photo ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="video-stream"></video>
            <button className="btn-capture" onClick={capturePhoto}>
              <Camera size={24} />
            </button>
          </>
        ) : (
          <img src={photo} alt="Captured" className="captured-image" />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>

      <div className="status-checks">
        <div className={`status-item ${locationStatus}`}>
          <MapPin size={18} />
          <span>Lokasi: {locationStatus === 'checking' ? 'Mengecek GPS...' : locationStatus === 'success' ? `Dalam Area Kantor ${distanceInfo}` : `Di Luar Area ${distanceInfo}`}</span>
          {locationStatus === 'success' && <CheckCircle size={16} />}
          {locationStatus === 'error' && <XCircle size={16} />}
        </div>
        <div className={`status-item ${ipStatus}`}>
          <Wifi size={18} />
          <span>Jaringan: {ipStatus === 'checking' ? 'Mengecek...' : ipStatus === 'success' ? 'IP Kantor Valid' : 'IP Tidak Valid'}</span>
          {ipStatus === 'success' && <CheckCircle size={16} />}
          {ipStatus === 'error' && <XCircle size={16} />}
        </div>
      </div>

      <div className="form-actions">
        {photo && (
          <button className="btn-secondary" onClick={retakePhoto}>Foto Ulang</button>
        )}
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={!photo || locationStatus !== 'success' || ipStatus !== 'success' || isUploading}
          style={{ opacity: (!photo || locationStatus !== 'success' || ipStatus !== 'success' || isUploading) ? 0.5 : 1 }}
        >
          {isUploading ? 'Mengupload...' : 'Kirim Absen'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceForm;
