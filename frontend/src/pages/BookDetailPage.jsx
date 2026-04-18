import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksApi, entitlementApi } from '../api';
import AccessBadge from '../components/common/AccessBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPremium, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const loadBook = async () => {
    try {
      const { data } = await booksApi.getById(id);
      setBook(data.book);
    } catch {
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBook(); }, [id, user]);

  const handlePurchase = async () => {
    if (!user) { navigate('/login', { state: { from: `/books/${id}` } }); return; }
    setPurchasing(true);
    try {
      const { data } = await entitlementApi.purchase(book.id);
      addToast(data.message, 'success');
      await loadBook();
    } catch (err) {
      addToast(err.response?.data?.error || 'Pembelian gagal.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) { navigate('/login', { state: { from: `/books/${id}` } }); return; }
    setSubscribing(true);
    try {
      await entitlementApi.subscribe();
      await refreshUser();
      await loadBook();
      addToast('Berlangganan berhasil! 🎉', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal berlangganan.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ink-200 border-t-ink-800 rounded-full" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen bg-cream-100 page-fade-in">
      <div className="page-container py-10">
        <Link to="/books" className="inline-flex items-center gap-2 font-body text-sm text-ink-500 hover:text-ink-800 mb-8 transition-colors">
          ← Kembali ke Katalog
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
            <div className="relative rounded-xl overflow-hidden shadow-book-hover bg-ink-100" style={{ aspectRatio: '3/4' }}>
              <img
                src={book.cover_url || COVER_FALLBACK}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = COVER_FALLBACK; }}
              />
              {!book.hasAccess && (
                <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-ink-800" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="font-body text-white text-sm font-medium">Konten Terkunci</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {book.genre && (
              <span className="font-mono text-xs text-ink-500 uppercase tracking-widest">{book.genre}</span>
            )}
            <h1 className="font-display text-4xl text-ink-900 mt-2 mb-2 leading-tight">{book.title}</h1>
            <p className="font-body text-ink-600 text-lg mb-4">oleh {book.author}</p>
            <div className="mb-6"><AccessBadge book={book} size="lg" /></div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {book.pages && (
                <div className="bg-white border border-ink-100 rounded-lg px-4 py-3">
                  <p className="font-mono text-xs text-ink-400 uppercase mb-1">Halaman</p>
                  <p className="font-body font-medium text-ink-900">{book.pages}</p>
                </div>
              )}
              <div className="bg-white border border-ink-100 rounded-lg px-4 py-3">
                <p className="font-mono text-xs text-ink-400 uppercase mb-1">Bahasa</p>
                <p className="font-body font-medium text-ink-900">{book.language === 'id' ? 'Indonesia' : book.language}</p>
              </div>
              <div className="bg-white border border-ink-100 rounded-lg px-4 py-3">
                <p className="font-mono text-xs text-ink-400 uppercase mb-1">Aksesibilitas</p>
                <p className="font-body font-medium text-ink-900">{book.is_sub_eligible ? 'Katalog + Beli' : 'Beli Saja'}</p>
              </div>
              {book.otp_price && (
                <div className="bg-white border border-ink-100 rounded-lg px-4 py-3">
                  <p className="font-mono text-xs text-ink-400 uppercase mb-1">Harga Beli</p>
                  <p className="font-body font-medium text-ink-900">Rp {Number(book.otp_price).toLocaleString('id-ID')}</p>
                </div>
              )}
            </div>

            {book.description && (
              <div className="mb-8">
                <h3 className="font-display text-lg text-ink-800 mb-2">Tentang Buku</h3>
                <p className="font-body text-ink-600 leading-relaxed">{book.description}</p>
              </div>
            )}

            {book.hasAccess ? (
              <div className="bg-forest-600/10 border border-forest-600/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-forest-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-forest-700">Kamu bisa membaca buku ini!</p>
                    <p className="font-body text-ink-500 text-sm">
                      {book.accessReason === 'purchased' ? 'Buku ini milikmu — kepemilikan permanen.' : 'Tersedia melalui langganan Premium aktifmu.'}
                    </p>
                  </div>
                </div>
                <button className="btn-success">📖 Baca Sekarang</button>
              </div>
            ) : (
              <div className="bg-white border-2 border-ink-200 rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg text-ink-900">Cara Mengakses Buku Ini</h3>
                {book.is_sub_eligible && (
                  <div className="flex items-center justify-between gap-4 p-4 bg-amber-400/10 rounded-lg border border-amber-400/30">
                    <div>
                      <p className="font-body font-medium text-ink-900 text-sm">★ Berlangganan Premium</p>
                      <p className="font-body text-ink-500 text-xs mt-0.5">Akses buku ini + seluruh katalog · Rp 49.000/bulan</p>
                    </div>
                    <button onClick={handleSubscribe} disabled={subscribing || isPremium}
                      className="btn-primary text-sm py-2 px-4 whitespace-nowrap disabled:opacity-50">
                      {subscribing ? 'Memproses...' : isPremium ? '✓ Aktif' : 'Langganan'}
                    </button>
                  </div>
                )}
                {book.otp_price && (
                  <div className="flex items-center justify-between gap-4 p-4 bg-cream-100 rounded-lg border border-ink-200">
                    <div>
                      <p className="font-body font-medium text-ink-900 text-sm">💰 Beli Satu Judul</p>
                      <p className="font-body text-ink-500 text-xs mt-0.5">Kepemilikan permanen · Rp {Number(book.otp_price).toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={handlePurchase} disabled={purchasing}
                      className="btn-secondary text-sm py-2 px-4 whitespace-nowrap disabled:opacity-50">
                      {purchasing ? 'Memproses...' : 'Beli'}
                    </button>
                  </div>
                )}
                {!user && (
                  <p className="font-body text-xs text-ink-500 text-center pt-2">
                    <Link to="/login" className="underline font-medium text-ink-700">Masuk</Link>{' '}atau{' '}
                    <Link to="/register" className="underline font-medium text-ink-700">daftar</Link>{' '}untuk mengakses buku ini.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
