import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const EMPTY_FORM = {
  title: '', author: '', description: '', cover_url: '', genre: '',
  pages: '', language: 'id', is_sub_eligible: true, otp_price: '',
};

function BookFormModal({ book, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(book ? {
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    cover_url: book.cover_url || '',
    genre: book.genre || '',
    pages: book.pages || '',
    language: book.language || 'id',
    is_sub_eligible: book.is_sub_eligible,
    otp_price: book.otp_price || '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        pages: form.pages ? Number(form.pages) : null,
        otp_price: form.otp_price ? Number(form.otp_price) : null,
      };
      if (book?.id) {
        await booksApi.update(book.id, payload);
        addToast('Buku berhasil diperbarui.', 'success');
      } else {
        await booksApi.create(payload);
        addToast('Buku berhasil ditambahkan.', 'success');
      }
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menyimpan buku.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <h2 className="font-display text-xl text-ink-900">
            {book ? 'Edit Buku' : 'Tambah Buku Baru'}
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-800 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Judul *</label>
              <input type="text" className="input-field" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Pengarang *</label>
              <input type="text" className="input-field" value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })} required />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Genre</label>
              <select className="input-field" value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}>
                <option value="">Pilih genre</option>
                {['Dongeng', 'Petualangan', 'Misteri', 'Fantasi', 'Edukasi'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Jumlah Halaman</label>
              <input type="number" className="input-field" value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })} min="1" />
            </div>
            <div className="col-span-2">
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">URL Cover</label>
              <input type="url" className="input-field" placeholder="https://..." value={form.cover_url}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Deskripsi</label>
              <textarea className="input-field" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Model Akses</label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_sub_eligible}
                    onChange={(e) => setForm({ ...form, is_sub_eligible: e.target.checked })}
                    className="w-4 h-4 accent-ink-800" />
                  <span className="font-body text-sm text-ink-700">Tersedia via Langganan</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ink-700 mb-1.5">Harga OTP (Rp)</label>
              <input type="number" className="input-field" placeholder="Kosongkan jika tidak dijual satuan"
                value={form.otp_price}
                onChange={(e) => setForm({ ...form, otp_price: e.target.value })} min="0" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-ink-100">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Menyimpan...' : book ? 'Simpan Perubahan' : 'Tambah Buku'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | book object
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchBooks();
  }, [isAdmin]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await booksApi.getAll();
      setBooks(data.books);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await booksApi.delete(id);
      addToast('Buku berhasil di-delist.', 'success');
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menghapus buku.', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 page-fade-in">
      {/* Header */}
      <div className="bg-ink-900 text-cream-100 py-10">
        <div className="page-container flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-ink-400 uppercase tracking-widest mb-2">Panel Admin</div>
            <h1 className="font-display text-3xl text-cream-100">Manajemen Buku</h1>
          </div>
          <button onClick={() => setModal('create')} className="btn-success">
            + Tambah Buku
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-cream-200 border-b border-ink-100">
        <div className="page-container py-5">
          <div className="flex gap-8">
            {[
              { label: 'Total Buku', val: books.length },
              { label: 'Katalog Langganan', val: books.filter((b) => b.is_sub_eligible).length },
              { label: 'Tersedia OTP', val: books.filter((b) => b.otp_price).length },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono text-xs text-ink-500 uppercase">{s.label}</p>
                <p className="font-display text-2xl text-ink-900">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="page-container py-8">
        <div className="bg-white rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="text-left font-mono text-xs text-ink-500 uppercase px-6 py-4">Buku</th>
                <th className="text-left font-mono text-xs text-ink-500 uppercase px-6 py-4 hidden md:table-cell">Genre</th>
                <th className="text-left font-mono text-xs text-ink-500 uppercase px-6 py-4 hidden lg:table-cell">Akses</th>
                <th className="text-left font-mono text-xs text-ink-500 uppercase px-6 py-4 hidden lg:table-cell">Harga OTP</th>
                <th className="text-left font-mono text-xs text-ink-500 uppercase px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-ink-50">
                    <td className="px-6 py-4" colSpan={5}>
                      <div className="h-5 bg-ink-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : books.map((book) => (
                <tr key={book.id} className="border-b border-ink-50 hover:bg-cream-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {book.cover_url && (
                        <img src={book.cover_url} alt="" className="w-10 h-12 object-cover rounded shadow" />
                      )}
                      <div>
                        <p className="font-body font-medium text-ink-900 text-sm">{book.title}</p>
                        <p className="font-body text-ink-500 text-xs">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs bg-ink-100 text-ink-600 px-2 py-1 rounded">{book.genre || '-'}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      {book.is_sub_eligible && <span className="block font-mono text-xs text-amber-600">★ Langganan</span>}
                      {book.otp_price && <span className="block font-mono text-xs text-forest-600">💰 OTP</span>}
                      {!book.is_sub_eligible && !book.otp_price && <span className="font-mono text-xs text-ink-400">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="font-body text-sm text-ink-700">
                      {book.otp_price ? `Rp ${Number(book.otp_price).toLocaleString('id-ID')}` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal(book)}
                        className="font-body text-xs font-medium text-ink-700 hover:text-ink-900 border border-ink-200 px-3 py-1.5 rounded hover:border-ink-400 transition-colors"
                      >
                        Edit
                      </button>
                      {confirmDelete === book.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(book.id)}
                            disabled={deletingId === book.id}
                            className="font-body text-xs font-medium text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId === book.id ? '...' : 'Ya, Delist'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="font-body text-xs text-ink-500 px-2 py-1.5">Batal</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(book.id)}
                          className="font-body text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded hover:border-red-400 transition-colors"
                        >
                          Delist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && books.length === 0 && (
            <div className="text-center py-16">
              <p className="font-body text-ink-500">Belum ada buku.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <BookFormModal
          book={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchBooks(); }}
        />
      )}
    </div>
  );
}
