import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '📚', title: 'Ratusan Judul', desc: 'Koleksi buku anak pilihan dari penulis lokal dan internasional terbaik.' },
  { icon: '🔒', title: 'Tanpa Iklan', desc: 'Pengalaman membaca yang bersih dan aman. Tidak ada gangguan dari iklan.' },
  { icon: '📥', title: 'Mode Offline', desc: 'Download dan baca kapan saja, bahkan tanpa koneksi internet.' },
  { icon: '⭐', title: 'Konten Premium', desc: 'Akses buku eksklusif dan rilis terbaru dengan pembelian langsung.' },
];

export default function HomePage() {
  const { user, isPremium } = useAuth();

  return (
    <div className="page-fade-in">
      {/* Hero */}
      <section className="bg-ink-900 text-cream-100 py-24 px-4">
        <div className="page-container text-center">
          <div className="inline-block bg-amber-400 text-ink-900 font-mono text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wider">
            PERPUSTAKAAN DIGITAL ANAK INDONESIA
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-cream-100 mb-6 leading-tight">
            Dunia Cerita<br />
            <span className="italic text-amber-400">untuk Si Kecil</span>
          </h1>
          <p className="font-body text-ink-300 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Ribuan buku berkualitas, aman dari iklan, bisa dibaca kapan saja dan di mana saja. Berlangganan mulai Rp 49.000/bulan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/books" className="btn-primary text-base py-3 px-8">
              Jelajahi Katalog
            </Link>
            {!user && (
              <Link to="/register" className="border-2 border-cream-300 text-cream-200 font-body font-medium px-8 py-3 rounded hover:bg-cream-100 hover:text-ink-900 transition-all duration-150">
                Daftar Gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Subscription CTA (for non-premium) */}
      {user && !isPremium && (
        <section className="bg-amber-400/20 border-y border-amber-400/30 py-6 px-4">
          <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl text-ink-900">Upgrade ke Premium</p>
              <p className="font-body text-ink-600 text-sm">Buka akses ke semua buku katalog. Hanya Rp 49.000/bulan.</p>
            </div>
            <Link to="/books" className="btn-primary whitespace-nowrap">Lihat Paket</Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-4">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Kenapa MainBooks?</h2>
            <p className="font-body text-ink-500 mt-2">Platform membaca yang dirancang khusus untuk keluarga Indonesia.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-ink-100 rounded-xl p-6 shadow-card hover:shadow-book transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display text-lg text-ink-900 mb-2">{f.title}</h3>
                <p className="font-body text-ink-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-cream-200 py-20 px-4">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Pilih Paketmu</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white border-2 border-ink-200 rounded-xl p-8">
              <div className="font-mono text-xs text-ink-500 mb-3 uppercase tracking-wider">Gratis</div>
              <div className="font-display text-4xl text-ink-900 mb-2">Rp 0</div>
              <p className="font-body text-ink-500 text-sm mb-6">Selamanya gratis</p>
              <ul className="space-y-3 mb-8">
                {['Beli buku satu per satu', 'Akses buku yang sudah dibeli', 'Mode offline (buku milik sendiri)'].map((i) => (
                  <li key={i} className="flex items-center gap-2 font-body text-sm text-ink-700">
                    <span className="text-ink-400">○</span> {i}
                  </li>
                ))}
              </ul>
              {!user ? (
                <Link to="/register" className="btn-secondary w-full text-center block">Mulai Gratis</Link>
              ) : !isPremium ? (
                <div className="text-center font-body text-sm text-forest-600 font-medium">✓ Paket kamu saat ini</div>
              ) : null}
            </div>

            {/* Premium */}
            <div className="bg-ink-900 border-2 border-ink-900 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-400 text-ink-900 font-mono text-xs font-bold px-2 py-1 rounded">POPULER</div>
              <div className="font-mono text-xs text-amber-400 mb-3 uppercase tracking-wider">Premium</div>
              <div className="font-display text-4xl text-cream-100 mb-2">Rp 49.000</div>
              <p className="font-body text-ink-400 text-sm mb-6">per bulan, batalkan kapan saja</p>
              <ul className="space-y-3 mb-8">
                {['Semua buku dalam katalog', 'Baca tanpa batas', 'Mode offline 7 hari', 'Rilis terbaru lebih awal'].map((i) => (
                  <li key={i} className="flex items-center gap-2 font-body text-sm text-cream-200">
                    <span className="text-amber-400">✓</span> {i}
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <div className="text-center font-body text-sm text-amber-400 font-medium">★ Paket aktifmu</div>
              ) : (
                <Link to={user ? '/books' : '/register'} className="btn-success w-full text-center block">
                  {user ? 'Upgrade Sekarang' : 'Coba Gratis 7 Hari'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-900 text-ink-400 py-10 px-4">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cream-200 rounded flex items-center justify-center">
              <span className="text-ink-900 font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display text-cream-300">MainBooks</span>
          </div>
          <p className="font-body text-xs">© 2024 MainBooks. Platform Buku Digital Anak Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
