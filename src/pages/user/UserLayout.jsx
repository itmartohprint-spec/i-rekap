import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Clock, Calendar, Wallet, Receipt } from 'lucide-react';
import SidakOverlay from '../../components/SidakOverlay';
import './UserLayout.css';

const UserLayout = () => {
  return (
    <div className="mobile-app-container">
      <SidakOverlay />
      <main className="mobile-main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/user/dashboard" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"} end>
          <Home size={24} />
          <span>Beranda</span>
        </NavLink>
        <NavLink to="/user/history" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Clock size={24} />
          <span>Riwayat</span>
        </NavLink>
        <NavLink to="/user/leave" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Calendar size={24} />
          <span>Cuti</span>
        </NavLink>
        <NavLink to="/user/cash-advance" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Wallet size={24} />
          <span>Kasbon</span>
        </NavLink>
        <NavLink to="/user/payslip" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Receipt size={24} />
          <span>Slip Gaji</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default UserLayout;
