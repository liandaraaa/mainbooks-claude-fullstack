import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin, isPremium } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`font-body text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'text-ink-900 border-b-2 border-ink-800 pb-0.5'
          : 'text-ink-600 hover:text-ink-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-cream-200 border-b-2 border-ink-100 sticky top-0 z-50">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-ink-800 rounded flex items-center justify-center group-hover:bg-ink-700 transition-colors">
              <span className="text-cream-100 font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-xl text-ink-900 tracking-tight">MainBooks</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLink('/', 'Beranda')}
            {navLink('/books', 'Katalog')}
            {user && navLink('/my-library', 'Perpustakaanku')}
            {isAdmin && navLink('/admin', 'Admin')}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-body text-sm font-medium text-ink-900 leading-tight">{user.name}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded-full ${
                      isPremium
                        ? 'bg-amber-400 text-ink-900'
                        : 'bg-ink-200 text-ink-600'
                    }`}>
                      {isPremium ? '★ Premium' : 'Gratis'}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Masuk</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Daftar</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-ink-800 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-6 bg-ink-800 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-6 bg-ink-800 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-ink-100 pt-3 space-y-3">
            {navLink('/', 'Beranda')}
            {navLink('/books', 'Katalog')}
            {user && navLink('/my-library', 'Perpustakaanku')}
            {isAdmin && navLink('/admin', 'Admin')}
            <div className="pt-2 border-t border-ink-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-700">{user.name}</span>
                  <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">Keluar</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm py-2 px-4 flex-1 text-center">Masuk</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2 px-4 flex-1 text-center">Daftar</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
