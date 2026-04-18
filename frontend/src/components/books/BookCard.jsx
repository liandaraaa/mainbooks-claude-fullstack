import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccessBadge from '../common/AccessBadge';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400';

export default function BookCard({ book }) {
  const navigate = useNavigate();

  return (
    <div className="book-card group" onClick={() => navigate(`/books/${book.id}`)}>
      {/* Cover */}
      <div className="relative overflow-hidden bg-ink-100" style={{ aspectRatio: '3/4' }}>
        <img
          src={book.cover_url || COVER_FALLBACK}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = COVER_FALLBACK; }}
        />
        {/* Locked overlay */}
        {!book.hasAccess && (
          <div className="absolute inset-0 bg-ink-900/30 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-ink-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        {/* Genre tag */}
        {book.genre && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-mono bg-cream-100/90 text-ink-700 px-2 py-0.5 rounded">
              {book.genre}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-display font-semibold text-ink-900 text-base leading-tight line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="font-body text-ink-500 text-xs mb-2">{book.author}</p>
        <AccessBadge book={book} />
      </div>
    </div>
  );
}
