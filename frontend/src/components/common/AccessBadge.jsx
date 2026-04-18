import React from 'react';

/**
 * Clearly shows whether a book is accessible or locked, and why.
 */
export default function AccessBadge({ book, size = 'sm' }) {
  const { hasAccess, accessReason, is_sub_eligible, otp_price } = book;

  const cls = size === 'lg'
    ? 'inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full font-body'
    : 'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full font-mono';

  if (hasAccess) {
    if (accessReason === 'purchased') {
      return (
        <span className={`${cls} bg-forest-600 text-white`}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Milikku
        </span>
      );
    }
    return (
      <span className={`${cls} bg-amber-400 text-ink-900`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Langganan
      </span>
    );
  }

  // Locked
  if (!is_sub_eligible && otp_price) {
    return (
      <span className={`${cls} bg-ink-100 text-ink-600`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Beli Rp{Number(otp_price).toLocaleString('id-ID')}
      </span>
    );
  }

  if (is_sub_eligible) {
    return (
      <span className={`${cls} bg-ink-200 text-ink-700`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Perlu Langganan
      </span>
    );
  }

  return (
    <span className={`${cls} bg-ink-200 text-ink-600`}>
      🔒 Terkunci
    </span>
  );
}
