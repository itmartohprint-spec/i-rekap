import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Receipt, Download, X } from 'lucide-react';

const UserPayslip = () => {
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    fetchPayslips();
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) return;
    try {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('license_code', licenseCode)
        .single();
      if (data) setCompanyInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayslips = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    const employeeData = JSON.parse(localStorage.getItem('employee-data') || '{}');
    const employeeId = employeeData.id;

    if (!licenseCode || !employeeId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('license_code', licenseCode)
        .eq('employee_id', employeeId)
        .order('month', { ascending: false });

      if (error) throw error;
      setPayslips(data || []);
    } catch (error) {
      console.error("Error fetching payslips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    return new Date(monthStr + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const handleDownloadSlip = async () => {
    const slipElement = document.getElementById('payslip-print-area');
    if (!slipElement) return;

    try {
      const actions = document.getElementById('payslip-actions');
      if (actions) actions.style.display = 'none';

      const canvas = await html2canvas(slipElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Slip_Gaji_${selectedSlip.month}_${selectedSlip.data.name}.pdf`);

      if (actions) actions.style.display = 'flex';
    } catch (error) {
      console.error("Gagal men-download PDF:", error);
      alert("Gagal mengunduh slip gaji.");
    }
  };

  return (
    <div className="mobile-page-container">
      <div className="mobile-header">
        <h2>Slip Gaji Saya</h2>
      </div>

      <div className="mobile-content" style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Memuat data slip gaji...</div>
        ) : payslips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Receipt size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: 0, color: '#334155' }}>Belum Ada Slip Gaji</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Slip gaji Anda akan muncul di sini setelah dipublikasikan oleh HRD.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {payslips.map((slip) => (
              <div 
                key={slip.id} 
                onClick={() => setSelectedSlip(slip)}
                style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.1rem' }}>{formatMonth(slip.month)}</h3>
                  <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>{formatRupiah(slip.data.takeHomePay)}</p>
                </div>
                <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '50%', color: '#3b82f6' }}>
                  <Receipt size={24} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Slip Gaji */}
      {selectedSlip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedSlip(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', zIndex: 2, color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div id="payslip-print-area" style={{ padding: '40px 25px', background: '#fff', fontFamily: 'Arial, sans-serif', position: 'relative', color: '#000' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '5rem', color: '#f8fafc', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 0 }}>RAHASIA</div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {companyInfo && companyInfo.logo_url && (
                      <img src={companyInfo.logo_url} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    )}
                    <div>
                      <h2 style={{ margin: '0 0 3px 0', color: '#0f172a', fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase' }}>{companyInfo ? companyInfo.company_name : 'Perusahaan'}</h2>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Dokumen Resmi Penggajian</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ margin: '0 0 3px 0', color: '#0062ff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px' }}>SLIP GAJI</h1>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '0.8rem', fontWeight: 'bold', background: '#e0e7ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>{formatMonth(selectedSlip.month)}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', borderLeft: '4px solid #0062ff' }}>
                  <div>
                    <table style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                      <tbody>
                        <tr><td style={{ width: '90px', padding: '2px 0', color: '#64748b' }}>ID Karyawan</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.id}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Nama Karyawan</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.name}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Jabatan</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.dept || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                      <tbody>
                        <tr><td style={{ width: '90px', padding: '2px 0', color: '#64748b' }}>Metode Gaji</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.salary_type || 'Harian'}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Bank Penyalur</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.bank_name || '-'}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>No. Rekening</td><td style={{ fontWeight: 'bold' }}>: {selectedSlip.data.account_number || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #166534', fontSize: '0.8rem' }}>PENERIMAAN</h4>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', color: '#0f172a' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 5px', color: '#0f172a' }}>{selectedSlip.data.salary_type === 'Bulanan' ? 'Gaji Pokok (Bulanan)' : `Gaji Pokok (${selectedSlip.data.daysPresent} Hari)`}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '6px 5px', color: '#0f172a' }}>{formatRupiah(selectedSlip.data.totalBaseSalary)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 5px', color: '#0f172a' }}>Tunjangan / Lembur</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '6px 5px', color: '#0f172a' }}>Rp 0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#991b1b', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #991b1b', fontSize: '0.8rem' }}>POTONGAN</h4>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', color: '#0f172a' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 5px', color: '#0f172a' }}>Kasbon / Pinjaman</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444', padding: '6px 5px' }}>{selectedSlip.data.cashAdvanceDeduction > 0 ? '-' + formatRupiah(selectedSlip.data.cashAdvanceDeduction) : 'Rp 0'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 5px', color: '#0f172a' }}>Denda Telat</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444', padding: '6px 5px' }}>{selectedSlip.data.lateDeductionTotal > 0 ? '-' + formatRupiah(selectedSlip.data.lateDeductionTotal) : 'Rp 0'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ border: '2px solid #0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: '#0f172a', color: '#fff' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>TAKE HOME PAY</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(selectedSlip.data.takeHomePay)}</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px 15px', color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', borderTop: '1px solid #334155' }}>
                    Ditransfer ke Rekening {selectedSlip.data.bank_name || '...'} - {selectedSlip.data.account_number || '...'}
                  </div>
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', padding: '0 15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 50px 0', fontSize: '0.75rem', color: '#334155' }}>Penerima / Karyawan,</p>
                    <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px', color: '#0f172a', fontSize: '0.8rem' }}>{selectedSlip.data.name}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 50px 0', fontSize: '0.75rem', color: '#334155' }}>Disetujui Oleh,</p>
                    <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px', color: '#0f172a', fontSize: '0.8rem' }}>Finance / HRD</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="payslip-actions" style={{ display: 'flex', padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button 
                onClick={handleDownloadSlip}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0062ff 0%, #0046b8 100%)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 98, 255, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Download Slip (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPayslip;
