import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Password tidak cocok.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      addToast('Akun berhasil dibuat! Selamat membaca 📚', 'success');
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex page-fade-in">
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cream-200 rounded flex items-center justify-center">
              <span className="text-ink-900 font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-xl text-cream-100">MainBooks</span>
          </Link>
        </div>
        <div>
          <h2 className="font-display text-4xl text-cream-100 mb-4">Mulai perjalanan membaca hari ini.</h2>
          <ul className="space-y-3">
            {['Akses ratusan buku anak berkualitas', 'Konten aman & tanpa iklan', 'Baca offline kapan saja'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 font-body text-ink-300 text-sm">
                <span className="w-5 h-5 bg-forest-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-ink-500 font-body text-xs">© 2024 MainBooks. Semua hak dilindungi.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-ink-900 mb-2">Buat Akun</h1>
            <p className="font-body text-ink-500 text-sm">Sudah punya akun? <Link to="/login" className="text-ink-800 font-medium underline">Masuk</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 font-body text-sm">{error}</div>
            )}
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Nama Lengkap</label>
              <input type="text" className="input-field" placeholder="Nama kamu" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="kamu@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 karakter" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Konfirmasi Password</label>
              <input type="password" className="input-field" placeholder="Ulangi password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
              {loading ? 'Memproses...' : 'Buat Akun'}
            </button>
            <p className="font-body text-xs text-ink-400 text-center">
              Dengan mendaftar, kamu menyetujui Syarat & Ketentuan MainBooks.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
