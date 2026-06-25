import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

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
          
          const dailySalary = emp.daily_salary ? parseFloat(emp.daily_salary) : 0;
          const totalBaseSalary = daysPresent * dailySalary;

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
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Menghitung kalkulasi...</td>
              </tr>
            ) : payrollData.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data karyawan</td>
              </tr>
            ) : (
              payrollData.map(row => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatRupiah(row.daily_salary || 0)} / hari</div>
                  </td>
                  <td>{row.daysPresent} Hari</td>
                  <td>{formatRupiah(row.totalBaseSalary)}</td>
                  <td style={{ color: 'var(--danger-color)' }}>{row.totalDeduction > 0 ? `-${formatRupiah(row.totalDeduction)}` : '-'}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{formatRupiah(row.takeHomePay)}</td>
                  <td><span className="status-badge badge-warning">Draft</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
