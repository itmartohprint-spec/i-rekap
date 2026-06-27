import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import UserLayout from './pages/user/UserLayout';
import UserHistory from './pages/user/UserHistory';
import UserLeave from './pages/user/UserLeave';
import UserCashAdvance from './pages/user/UserCashAdvance';
import UserInfo from './pages/user/UserInfo';
import UserPayslip from './pages/user/UserPayslip';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeList from './pages/admin/EmployeeList';
import AttendanceReports from './pages/admin/AttendanceReports';
import Settings from './pages/admin/Settings';

import LandingPage from './pages/LandingPage';
import RegisterDemo from './pages/RegisterDemo';
import Checkout from './pages/Checkout';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import LiveMonitor from './pages/LiveMonitor';

import TrackGPS from './pages/admin/TrackGPS';
import LeaveManagement from './pages/admin/LeaveManagement';
import CashAdvance from './pages/admin/CashAdvance';
import AdminSidak from './pages/admin/AdminSidak';
import ShiftSchedule from './pages/admin/ShiftSchedule';
import Payroll from './pages/admin/Payroll';

function App() {
  React.useEffect(() => {
    // Intercept old URL formats (without hash) and redirect them to HashRouter format
    if (window.location.pathname === '/login') {
      const search = window.location.search; // e.g. "?lic=..."
      window.location.replace(`/#/login${search}`);
      return;
    }

    const primary = localStorage.getItem('theme-primary');
    const secondary = localStorage.getItem('theme-secondary');
    const font = localStorage.getItem('theme-font');
    const bg = localStorage.getItem('theme-bg');
    
    if (primary) document.documentElement.style.setProperty('--primary-color', primary);
    if (secondary) document.documentElement.style.setProperty('--secondary-color', secondary);
    if (font) document.documentElement.style.setProperty('--font-family', font);
    if (bg) {
      document.body.className = '';
      document.body.classList.add(bg);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Landing Page for SaaS */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Demo Registration */}
        <Route path="/register-demo" element={<RegisterDemo />} />
        
        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Live Monitor Khusus Pimpinan (Public) */}
        <Route path="/monitor/:licenseCode" element={<LiveMonitor />} />
        
        {/* User Mobile Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="history" element={<UserHistory />} />
          <Route path="leave" element={<UserLeave />} />
          <Route path="cash-advance" element={<UserCashAdvance />} />
          <Route path="payslip" element={<UserPayslip />} />
          <Route path="info" element={<UserInfo />} />
        </Route>

        {/* Admin Desktop Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="gps" element={<TrackGPS />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="reports" element={<AttendanceReports />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="cash-advance" element={<CashAdvance />} />
          <Route path="sidak" element={<AdminSidak />} />
          <Route path="shift" element={<ShiftSchedule />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Super Admin / Provider Routes */}
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
