import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entitlementApi } from '../api';
import { useAuth } from '../context/AuthContext';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400';

export default function MyLibraryPage() {
  const { user, isPremium } = useAuth();
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entitlementApi.myBooks()
      .then(({ data }) => setEntitlements(data.entitlements))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 page-fade-in">
      <div className="bg-cream-200 border-b border-ink-100 py-10">
        <div className="page-container">
          <h1 className="section-title">Perpustakaanku</h1>
          <p className="font-body text-ink-500 text-sm mt-1">
            Buku yang sudah kamu beli · kepemilikan permanen
          </p>
        </div>
      </div>

      <div className="page-container py-10">
        {/* Status bar */}
        <div className={`rounded-xl p-5 mb-8 border-2 ${isPremium ? 'bg-amber-400/10 border-amber-400/40' : 'bg-ink-100 border-ink-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-body font-semibold text-ink-900">
                {isPremium ? '★ Status: Premium' : 'Status: Gratis'}
              </p>
              <p className="font-body text-ink-500 text-sm">
                {isPremium
                  ? `Langganan aktif hingga ${user?.sub_end_date ? new Date(user.sub_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`
                  : 'Upgrade untuk akses semua buku katalog.'}
              </p>
            </div>
            {!isPremium && (
              <Link to="/books" className="btn-primary text-sm">Upgrade Premium</Link>
            )}
          </div>
        </div>

        {/* Purchased books */}
        <h2 className="font-display text-xl text-ink-900 mb-5">Buku yang Dibeli ({entitlements.length})</h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-ink-200 rounded-lg mb-2" style={{ aspectRatio: '3/4' }} />
                <div className="h-4 bg-ink-200 rounded mb-1" />
                <div className="h-3 bg-ink-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : entitlements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-ink-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-display text-xl text-ink-700 mb-2">Belum ada buku</h3>
            <p className="font-body text-ink-500 mb-6">Beli buku untuk memilikinya secara permanen.</p>
            <Link to="/books" className="btn-primary">Jelajahi Katalog</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {entitlements.map((e) => (
              <Link
                key={e.id}
                to={`/books/${e.book_id}`}
                className="book-card group"
              >
                <div className="relative overflow-hidden bg-ink-100" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={e.cover_url || COVER_FALLBACK}
                    alt={e.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(ev) => { ev.target.src = COVER_FALLBACK; }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-mono bg-forest-600 text-white px-2 py-0.5 rounded-full">✓ Milikku</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display text-sm text-ink-900 font-semibold line-clamp-2 mb-1">{e.title}</h3>
                  <p className="font-body text-ink-500 text-xs">{e.author}</p>
                  <p className="font-mono text-xs text-ink-400 mt-2">
                    Dibeli {new Date(e.granted_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
