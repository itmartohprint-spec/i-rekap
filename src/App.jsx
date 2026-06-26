import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import UserLayout from './pages/user/UserLayout';
import UserHistory from './pages/user/UserHistory';
import UserLeave from './pages/user/UserLeave';
import UserCashAdvance from './pages/user/UserCashAdvance';
import UserInfo from './pages/user/UserInfo';
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
import ShiftSchedule from './pages/admin/ShiftSchedule';
import Payroll from './pages/admin/Payroll';

function App() {
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
