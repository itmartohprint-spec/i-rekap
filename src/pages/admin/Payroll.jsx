import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    generatePayroll();
  }, [selectedMonth]);

  const generatePayroll = async () => {
    setIsLoading(true);
    const licenseCode = localStorage.getItem('valid-license');
    if (!licenseCode) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch Company Info
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('license_code', licenseCode)
        .single();
      if (companyData) setCompanyInfo(companyData);

      // 1. Fetch Employees
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('license_code', licenseCode);

      // 2. Fetch Attendance for selected month
      // Format selectedMonth (YYYY-MM)
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth.substring(0, 4), selectedMonth.substring(5, 7), 0).toISOString().substring(0, 10);
      
      const { data: attendances } = await supabase
        .from('attendance')
        .select('*')
        .eq('license_code', licenseCode)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Hadir');

      // 3. Fetch Approved Cash Advances
      const { data: cashAdvances } = await supabase
        .from('cash_advances')
        .select('*')
        .eq('license_code', licenseCode)
        .eq('status', 'approved');

      if (employees) {
        const computedPayroll = employees.map(emp => {
          const empAttendance = attendances ? attendances.filter(a => a.employee_id === emp.id && a.type === 'in') : [];
          const daysPresent = empAttendance.length;
          
          const salaryType = emp.salary_type || 'Harian';
          const dailySalary = emp.daily_salary ? parseFloat(emp.daily_salary) : 0;
          
          let totalBaseSalary = 0;
          if (salaryType === 'Bulanan') {
            totalBaseSalary = dailySalary; // For monthly, it's a fixed amount
          } else {
            totalBaseSalary = daysPresent * dailySalary; // For daily, it depends on attendance
          }

          const empCashAdvances = cashAdvances ? cashAdvances.filter(c => c.employee_id === emp.id) : [];
          const totalDeduction = empCashAdvances.reduce((sum, c) => sum + parseFloat(c.amount), 0);

          const takeHomePay = totalBaseSalary - totalDeduction;

          return {
            ...emp,
            daysPresent,
            totalBaseSalary,
            totalDeduction,
            takeHomePay
          };
        });

        setPayrollData(computedPayroll);
      }
    } catch (err) {
      console.error("Error generating payroll:", err);
    }
    
    setIsLoading(false);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const markAsPaid = () => {
    alert("Slip gaji berhasil dikirim ke email semua karyawan!");
  };

  const handleDownloadSlip = async () => {
    const slipElement = document.getElementById('payslip-print-area');
    if (!slipElement) return;
    
    // Temporarily hide the close button and download button for print
    const actionButtons = document.getElementById('payslip-actions');
    if (actionButtons) actionButtons.style.display = 'none';

    try {
      const canvas = await html2canvas(slipElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a5'); // A5 size for payslip
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Slip_Gaji_${selectedSlip.name}_${selectedMonth}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      if (actionButtons) actionButtons.style.display = 'flex';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Penggajian & Lembur</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="month" 
            className="form-input" 
            style={{ width: 'auto' }} 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button className="btn-primary" onClick={markAsPaid}>Kirim Slip Gaji</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Kehadiran</th>
              <th>Gaji Pokok (Total)</th>
              <th>Potongan (Kasbon)</th>
              <th>Total Diterima</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Menghitung penggajian...</td>
              </tr>
            ) : payrollData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data karyawan</td>
              </tr>
            ) : (
              payrollData.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <strong>{emp.name}</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatRupiah(emp.daily_salary)} / hari</span>
                  </td>
                  <td>{emp.daysPresent} Hari</td>
                  <td>{formatRupiah(emp.totalBaseSalary)}</td>
                  <td><span style={{ color: '#ef4444' }}>{emp.totalDeduction > 0 ? '-' + formatRupiah(emp.totalDeduction) : '-'}</span></td>
                  <td><strong style={{ color: '#10b981' }}>{formatRupiah(emp.takeHomePay)}</strong></td>
                  <td><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, background: '#fef3c7', color: '#d97706' }}>Draft</span></td>
                  <td>
                    <button 
                      onClick={() => setSelectedSlip(emp)}
                      style={{ padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      Lihat Slip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slip Gaji Modal */}
      {selectedSlip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div id="payslip-print-area" style={{ padding: '40px', background: '#fff' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '20px', marginBottom: '20px' }}>
                {companyInfo && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                    {companyInfo.logo_url && (
                      <img src={companyInfo.logo_url} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    )}
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>{companyInfo.company_name}</h3>
                  </div>
                )}
                <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.5rem' }}>SLIP GAJI KARYAWAN</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Periode: {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
              </div>

              {/* Employee Details */}
              <table style={{ width: '100%', marginBottom: '20px', fontSize: '0.95rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '40%', padding: '4px 0', color: '#64748b' }}>Nama Karyawan</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#0f172a' }}>: {selectedSlip.name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>ID Karyawan</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#0f172a' }}>: {selectedSlip.id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Posisi / Jabatan</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#0f172a' }}>: {selectedSlip.position || 'Staff'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Earnings & Deductions */}
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>PENERIMAAN</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                  <span>
                    {selectedSlip.salary_type === 'Bulanan' 
                      ? `Gaji Pokok (Bulanan Tetap)` 
                      : `Gaji Pokok (${selectedSlip.daysPresent} Hari x ${formatRupiah(selectedSlip.daily_salary)})`
                    }
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{formatRupiah(selectedSlip.totalBaseSalary)}</span>
                </div>
                
                <h4 style={{ margin: '15px 0 10px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>POTONGAN</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                  <span>Pinjaman / Kasbon</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{selectedSlip.totalDeduction > 0 ? '-' + formatRupiah(selectedSlip.totalDeduction) : 'Rp 0'}</span>
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#0f172a', color: '#fff', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>TOTAL DITERIMA</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(selectedSlip.takeHomePay)}</span>
              </div>
              
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 50px 0', fontSize: '0.85rem' }}>Penerima,</p>
                  <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block', padding: '0 20px' }}>{selectedSlip.name}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 50px 0', fontSize: '0.85rem' }}>HR Manager,</p>
                  <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block', padding: '0 20px' }}>________________</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div id="payslip-actions" style={{ display: 'flex', gap: '10px', padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button 
                onClick={() => setSelectedSlip(null)}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                Tutup
              </button>
              <button 
                onClick={handleDownloadSlip}
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #0062ff 0%, #0046b8 100%)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 98, 255, 0.4)' }}
              >
                Download PDF
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;
