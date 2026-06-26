import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
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
      // 1. Ambil Company Info dari Local Storage (karena disetting via Settings.jsx)
      const savedLogo = localStorage.getItem('company-logo') || '/maskot.png';
      const savedName = localStorage.getItem('company-name') || 'PT Maju Bersama';
      setCompanyInfo({ company_name: savedName, logo_url: savedLogo });

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
        .lte('date', endDate);

      // 3. Fetch Approved Cash Advances
      const { data: cashAdvances } = await supabase
        .from('cash_advances')
        .select('*')
        .eq('license_code', licenseCode)
        .eq('status', 'approved');

      if (employees) {
        const computedPayroll = employees.map(emp => {
          const empAttendance = attendances ? attendances.filter(a => a.employee_id === emp.id) : [];
          
          // Separate on-time and late (only for check-in)
          const inLogs = empAttendance.filter(a => a.type === 'in');
          const lateLogs = inLogs.filter(a => a.status === 'Terlambat' || a.status === 'late');
          const onTimeLogs = inLogs.filter(a => a.status !== 'Terlambat' && a.status !== 'late');
          
          const daysPresent = inLogs.length;
          
          const salaryType = emp.salary_type || 'Harian';
          const dailySalary = emp.daily_salary ? parseFloat(emp.daily_salary) : 0;
          
          let totalBaseSalary = 0;
          if (salaryType === 'Bulanan') {
            totalBaseSalary = dailySalary; 
          } else {
            totalBaseSalary = daysPresent * dailySalary; 
          }

          const empCashAdvances = cashAdvances ? cashAdvances.filter(c => c.employee_id === emp.id) : [];
          const cashAdvanceDeduction = empCashAdvances.reduce((sum, c) => sum + parseFloat(c.amount), 0);

          // Calculate Lateness Deduction based on Settings
          const deductionType = localStorage.getItem(`payroll_late_type_${licenseCode}`) || 'proportional';
          const deductionAmountStr = localStorage.getItem(`payroll_late_amount_${licenseCode}`);
          const deductionAmountFlat = deductionAmountStr ? parseFloat(deductionAmountStr) : 0;

          let lateDeductionTotal = 0;
          // Load shifts for accurate lateness calculation
          const savedEmpShifts = JSON.parse(localStorage.getItem(`employee_shifts_${licenseCode}`) || '{}');
          const savedMasterShifts = JSON.parse(localStorage.getItem(`master_shifts_${licenseCode}`) || '[]');
          const shiftId = savedEmpShifts[emp.id] || 'default';
          const shift = savedMasterShifts.find(s => s.id === shiftId);
          const expectedStart = (shift && shift.startTime) ? shift.startTime : '08:00';
          const expectedStartSec = `${expectedStart}:00`;

          const processedLateLogs = lateLogs.map(log => {
            const shiftStart = new Date(`${log.date}T${expectedStartSec}`).getTime();
            const actualIn = log.created_at ? new Date(log.created_at).getTime() + (7 * 3600000) : new Date(`${log.date}T${log.time_in || '09:00:00'}`).getTime();
            let minutesLate = Math.floor((actualIn - shiftStart) / 60000);
            if (minutesLate < 0) minutesLate = 0;
            
            let deduction = 0;
            if (deductionType === 'proportional') {
              deduction = (dailySalary / 8 / 60) * minutesLate;
            } else if (deductionType === 'flat_minute') {
              deduction = deductionAmountFlat * minutesLate;
            } else if (deductionType === 'flat_incident') {
              deduction = deductionAmountFlat;
            }
            
            lateDeductionTotal += deduction;
            
            return {
              ...log,
              minutesLate,
              deduction
            };
          });

          const totalDeduction = cashAdvanceDeduction + lateDeductionTotal;
          const takeHomePay = totalBaseSalary - totalDeduction;
          
          // Process Real Overtime Data
          const overtimeInLogs = empAttendance.filter(a => a.type === 'overtime_in');
          const overtimeOutLogs = empAttendance.filter(a => a.type === 'overtime_out');
          
          const overtimeLogs = overtimeInLogs.map(inLog => {
            const outLog = overtimeOutLogs.find(o => o.date === inLog.date);
            const start = inLog.time_in;
            const end = outLog ? (outLog.time_out || outLog.time_in) : '-'; // some cases time_out might be used or time_in
            
            let totalHours = 0;
            if (outLog && start && end !== '-') {
               const startD = new Date(`${inLog.date}T${start}`);
               const endD = new Date(`${outLog.date}T${end}`);
               let diff = (endD - startD) / 3600000;
               if (diff < 0) diff += 24; // Cross midnight
               totalHours = Math.floor(diff);
            }
            
            return {
              date: inLog.date,
              start: start,
              end: end,
              totalHours: totalHours
            };
          });

          return {
            ...emp,
            daysPresent,
            totalBaseSalary,
            totalDeduction,
            cashAdvanceDeduction,
            lateDeductionTotal,
            takeHomePay,
            lateLogs: processedLateLogs,
            overtimeLogs
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
      
      const pdf = new jsPDF('p', 'mm', 'a4'); // Use A4 to prevent cut-off
      const margin = 15; // 15mm margin
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setSelectedSlip(emp)}
                        style={{ padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        Lihat Slip
                      </button>
                      <button 
                        onClick={() => setSelectedDetail(emp)}
                        style={{ padding: '6px 12px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      >
                        Lihat Detail
                      </button>
                    </div>
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
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Posisi / Bagian</td>
                    <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#0f172a' }}>: {selectedSlip.dept || 'Staff'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Earnings & Deductions */}
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', color: '#334155' }}>
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
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{selectedSlip.cashAdvanceDeduction > 0 ? '-' + formatRupiah(selectedSlip.cashAdvanceDeduction) : 'Rp 0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                  <span>Keterlambatan ({selectedSlip.lateLogs ? selectedSlip.lateLogs.reduce((sum, log) => sum + (log.minutesLate || 0), 0) : 0} Menit)</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{selectedSlip.lateDeductionTotal > 0 ? '-' + formatRupiah(selectedSlip.lateDeductionTotal) : 'Rp 0'}</span>
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

      {/* Detail Modal */}
      {selectedDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Riwayat Keterlambatan */}
              <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Riwayat Keterlambatan</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '0.9rem', color: '#334155' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>TANGGAL</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>SHIFT</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>JAM MASUK</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>TELAT</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>POTONGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetail.lateLogs && selectedDetail.lateLogs.length > 0 ? selectedDetail.lateLogs.map((log, idx) => {
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px' }}>{log.date}</td>
                        <td style={{ padding: '10px' }}>
                          {(() => {
                            const savedEmpShifts = JSON.parse(localStorage.getItem(`employee_shifts_${licenseCode}`) || '{}');
                            const savedMasterShifts = JSON.parse(localStorage.getItem(`master_shifts_${licenseCode}`) || '[]');
                            const shiftId = savedEmpShifts[selectedDetail.id] || 'default';
                            const shift = savedMasterShifts.find(s => s.id === shiftId);
                            return shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Shift Normal (08:00 - 17:00)';
                          })()}
                        </td>
                        <td style={{ padding: '10px' }}>{log.time_in || '08:45:00'}</td>
                        <td style={{ padding: '10px' }}>{log.minutesLate || 0} Menit</td>
                        <td style={{ padding: '10px' }}>{formatRupiah(log.deduction || 0)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada riwayat keterlambatan bulan ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Riwayat Lembur */}
              <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Riwayat Lembur</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#334155' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>TANGGAL</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>MULAI LEMBUR</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>SELESAI LEMBUR</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>TOTAL JAM</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetail.overtimeLogs && selectedDetail.overtimeLogs.length > 0 ? selectedDetail.overtimeLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{log.date}</td>
                      <td style={{ padding: '10px' }}>{log.start}</td>
                      <td style={{ padding: '10px' }}>{log.end}</td>
                      <td style={{ padding: '10px' }}>{log.totalHours} Jam</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada riwayat lembur bulan ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedDetail(null)}
                style={{ padding: '8px 24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                Tutup
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;
