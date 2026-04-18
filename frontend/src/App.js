import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { RequireAuth, RequireAdmin } from './components/common/ProtectedRoute';

import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import MyLibraryPage from './pages/MyLibraryPage';
import AdminPage from './pages/AdminPage';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/books" element={<Layout><BooksPage /></Layout>} />
            <Route path="/books/:id" element={<Layout><BookDetailPage /></Layout>} />
            <Route path="/my-library" element={<Layout><RequireAuth><MyLibraryPage /></RequireAuth></Layout>} />
            <Route path="/admin" element={<Layout><RequireAdmin><AdminPage /></RequireAdmin></Layout>} />
            <Route path="*" element={
              <Layout>
                <div className="min-h-[60vh] flex items-center justify-center page-fade-in">
                  <div className="text-center">
                    <p className="font-mono text-ink-400 text-sm mb-4">404</p>
                    <h1 className="font-display text-4xl text-ink-900 mb-4">Halaman tidak ditemukan</h1>
                    <a href="/" className="btn-primary">Kembali ke Beranda</a>
                  </div>
                </div>
              </Layout>
            } />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
