import React, { useState, useEffect } from 'react';
import { booksApi, entitlementApi } from '../api';
import BookCard from '../components/books/BookCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const GENRES = ['Semua', 'Dongeng', 'Petualangan', 'Misteri', 'Fantasi', 'Edukasi'];

export default function BooksPage() {
  const { user, isPremium, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('Semua');
  const [search, setSearch] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await booksApi.getAll();
      setBooks(data.books);
    } catch {
      addToast('Gagal memuat katalog buku.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, [user]);

  const handleSubscribe = async () => {
  if (!user) { addToast('Login dulu untuk berlangganan.', 'info'); return; }
  setSubscribing(true);
  try {
    const { data } = await entitlementApi.subscribe();
    
    if (data.token) {
      localStorage.setItem('mb_token', data.token);
    }
    localStorage.setItem('mb_user', JSON.stringify({
      ...user,
      tier_status: 'premium',
      sub_end_date: data.sub_end_date,
    }));
    
    await refreshUser();
    await fetchBooks();
    addToast('Berlangganan berhasil! Nikmati semua buku. 🎉', 'success');
  } catch (err) {
    addToast(err.response?.data?.error || 'Gagal berlangganan.', 'error');
  } finally {
    setSubscribing(false);
  }
};

  const filtered = books.filter((b) => {
    const matchGenre = genre === 'Semua' || b.genre === genre;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  const accessibleCount = books.filter((b) => b.hasAccess).length;

  return (
    <div className="page-fade-in min-h-screen bg-cream-100">
      {/* Header */}
      <div className="bg-cream-200 border-b border-ink-100 py-10">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="section-title">Katalog Buku</h1>
              <p className="font-body text-ink-500 text-sm mt-1">
                {books.length} judul tersedia · {accessibleCount} dapat diakses
              </p>
            </div>

            {/* Subscribe CTA */}
            {user && !isPremium && (
              <div className="bg-amber-400/20 border border-amber-400/50 rounded-lg px-5 py-4 flex items-center gap-4">
                <div>
                  <p className="font-body font-medium text-ink-900 text-sm">Buka semua buku</p>
                  <p className="font-body text-ink-600 text-xs">Rp 49.000/bulan · batalkan kapan saja</p>
                </div>
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="btn-primary text-sm py-2 px-4 whitespace-nowrap disabled:opacity-50">
                  {subscribing ? 'Memproses...' : 'Langganan'}
                </button>
              </div>
            )}

            {isPremium && (
              <div className="bg-forest-600/10 border border-forest-600/30 rounded-lg px-5 py-3">
                <p className="font-body font-medium text-forest-700 text-sm">★ Kamu adalah member Premium</p>
                <p className="font-body text-ink-500 text-xs">Akses semua buku katalog tanpa batas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-ink-100 py-4 sticky top-16 z-10">
        <div className="page-container flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari judul atau pengarang..."
            className="input-field flex-1 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`whitespace-nowrap px-3 py-2 rounded font-body text-sm font-medium transition-colors ${
                  genre === g
                    ? 'bg-ink-800 text-cream-100'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Book grid */}
      <div className="page-container py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-ink-200 rounded-lg mb-3" style={{ aspectRatio: '3/4' }} />
                <div className="h-4 bg-ink-200 rounded mb-2" />
                <div className="h-3 bg-ink-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-display text-xl text-ink-700">Tidak ada buku ditemukan</h3>
            <p className="font-body text-ink-500 mt-2">Coba kata kunci atau genre lain.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="font-body text-sm text-ink-500">Menampilkan {filtered.length} buku</p>
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-ink-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-forest-600 inline-block" /> Bisa diakses</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ink-300 inline-block" /> Terkunci</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
