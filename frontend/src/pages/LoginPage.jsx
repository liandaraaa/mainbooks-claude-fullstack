import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/books';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Selamat datang kembali! 📚', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-cream-100 flex page-fade-in">
      {/* Left decorative panel */}
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
          <blockquote className="font-display text-3xl text-cream-200 italic leading-relaxed mb-6">
            "Membaca adalah jendela dunia yang tak pernah tertutup."
          </blockquote>
          <p className="font-body text-ink-300 text-sm">Bergabunglah dengan ribuan keluarga Indonesia yang sudah membaca bersama MainBooks.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['📚', '🌟', '🎨'].map((e, i) => (
            <div key={i} className="aspect-square bg-ink-800 rounded-lg flex items-center justify-center text-3xl opacity-60">
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-ink-900 mb-2">Masuk</h1>
            <p className="font-body text-ink-500 text-sm">Belum punya akun? <Link to="/register" className="text-ink-800 font-medium underline">Daftar gratis</Link></p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6 p-4 bg-amber-400/20 border border-amber-400/40 rounded-lg">
            <p className="font-mono text-xs text-ink-700 font-medium mb-2">DEMO AKUN</p>
            <div className="space-y-1">
              <button type="button" onClick={() => fillDemo('admin@mainbooks.id', 'admin123')} className="text-xs font-body text-ink-700 hover:text-ink-900 underline block">
                Admin → admin@mainbooks.id / admin123
              </button>
              <button type="button" onClick={() => fillDemo('premium@mainbooks.id', 'password123')} className="text-xs font-body text-ink-700 hover:text-ink-900 underline block">
                Premium → premium@mainbooks.id / password123
              </button>
              <button type="button" onClick={() => fillDemo('user@mainbooks.id', 'password123')} className="text-xs font-body text-ink-700 hover:text-ink-900 underline block">
                Gratis → user@mainbooks.id / password123
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 font-body text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="kamu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
