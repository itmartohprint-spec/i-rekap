import React, { useState, useRef } from 'react';
import { Activity, X, Upload, Send, FileWarning, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './QuickLeaveForm.css';

const QuickLeaveForm = ({ onClose }) => {
  const [leaveType, setLeaveType] = useState('izin'); // 'izin' or 'sakit'
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB!');
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Alasan/keterangan wajib diisi!');
      return;
    }
    
    if (leaveType === 'sakit' && !attachment) {
      alert('Surat dokter wajib diunggah untuk pengajuan Sakit!');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    const licenseCode = localStorage.getItem('valid-license');
    const employeeId = localStorage.getItem('user-id');

    if (!licenseCode || !employeeId) {
      alert("Sesi login tidak valid. Silakan login ulang.");
      return;
    }

    const leaveTypeString = leaveType === 'izin' ? 'Izin' : 'Sakit';
    const finalReason = `[${leaveTypeString}] ${reason}`;
    
    const submitToSupabase = async () => {
      const { error } = await supabase.from('leave_requests').insert([{
        license_code: licenseCode,
        employee_id: employeeId,
        start_date: formattedDate,
        end_date: formattedDate,
        reason: finalReason,
        status: 'pending',
        attachment_url: attachment ? attachment.name : null
      }]);

      if (error) {
        console.error("Supabase Error:", error);
        alert("Terjadi kesalahan: " + error.message);
      } else {
        alert(`Pengajuan ${leaveTypeString} berhasil dikirim!`);
        onClose();
      }
    };

    submitToSupabase();
  };

  return (
    <div className="quick-leave-form">
      <div className="quick-leave-header">
        <h3><Activity size={20} color="#f97316" /> Pengajuan Cepat</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={24} />
        </button>
      </div>

      <div className="type-selector">
        <div 
          className={`type-option ${leaveType === 'izin' ? 'active izin' : ''}`}
          onClick={() => setLeaveType('izin')}
        >
          <FileWarning size={24} />
          <span>Izin</span>
        </div>
        <div 
          className={`type-option ${leaveType === 'sakit' ? 'active sakit' : ''}`}
          onClick={() => setLeaveType('sakit')}
        >
          <Stethoscope size={24} />
          <span>Sakit</span>
        </div>
      </div>

      <div className="form-group">
        <label>Alasan / Keterangan</label>
        <textarea 
          className="form-textarea"
          rows="3"
          placeholder={`Tuliskan alasan ${leaveType === 'izin' ? 'izin' : 'sakit'} Anda...`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {leaveType === 'sakit' && (
        <div className="form-group">
          <label>Surat Dokter (Wajib)</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*,.pdf" 
          />
          <div className="upload-area" onClick={() => fileInputRef.current.click()}>
            <Upload size={24} color="#3b82f6" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
              {attachment ? attachment.name : 'Klik untuk unggah Surat Dokter'}
            </div>
            {!attachment && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                Maks. 2MB (JPG, PNG, PDF)
              </div>
            )}
          </div>
        </div>
      )}

      <button 
        className="btn-submit" 
        onClick={handleSubmit}
        disabled={leaveType === 'sakit' && !attachment}
      >
        <Send size={18} />
        Kirim Pengajuan
      </button>
    </div>
  );
};

export default QuickLeaveForm;
