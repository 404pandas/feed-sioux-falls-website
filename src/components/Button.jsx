import React from 'react';
import { Link } from 'react-router-dom';

// variant: 'primary' (jar teal) | 'accent' (heart pink - giving) | 'coin'
//          (yellow) | 'outline' | 'outline-danger' | 'outline-success'
//
// Renders a link instead of a button when given `to` (a page in this site)
// or `href` (another website - opens in a new tab).
export default function Button({
  title,
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  small,
  block,
  type = 'button',
  style,
  className: extraClassName,
  to,
  href,
  ariaLabel,
}) {
  const variantClass =
    {
      primary: 'btn-primary',
      accent: 'btn-accent',
      coin: 'btn-coin',
      outline: 'btn-outline',
      'outline-danger': 'btn-outline-danger',
      'outline-success': 'btn-outline-success',
    }[variant] || 'btn-primary';

  const className = ['btn', variantClass, small && 'btn-small', block && 'btn-block', extraClassName]
    .filter(Boolean)
    .join(' ');

  const content = loading ? 'Working…' : children || title;

  if (to) {
    return (
      <Link to={to} className={className} style={style} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={className} style={style} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
