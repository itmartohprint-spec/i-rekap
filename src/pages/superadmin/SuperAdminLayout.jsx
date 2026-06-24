import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, LogOut, ShieldCheck } from 'lucide-react';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="super-admin-layout">
      <aside className="super-sidebar">
        <div className="super-logo">
          <h2 style={{margin:0}}>i-Rekap</h2>
        </div>
        
        <nav className="super-nav">
          <NavLink to="/super-admin/dashboard" className={({isActive}) => isActive ? "super-nav-item active" : "super-nav-item"}>
            <LayoutDashboard size={20} />
            Dashboard Utama
          </NavLink>
          <NavLink to="/super-admin/companies" className={({isActive}) => isActive ? "super-nav-item active" : "super-nav-item"}>
            <Building2 size={20} />
            Daftar Tenant
          </NavLink>
          <NavLink to="/super-admin/licenses" className={({isActive}) => isActive ? "super-nav-item active" : "super-nav-item"}>
            <CreditCard size={20} />
            Manajemen Lisensi
          </NavLink>
        </nav>

        <div className="super-footer">
          <button className="super-logout" onClick={handleLogout}>
            <LogOut size={20} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      <div className="super-content">
        <header className="super-header">
          <div className="super-profile">
            <span>Penyedia Layanan</span>
            <div className="super-avatar">P</div>
          </div>
        </header>

        <main className="super-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
