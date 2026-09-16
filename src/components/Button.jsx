import React from 'react';

// variant: 'primary' (forest green) | 'accent' (pumpkin - the one CTA color)
//          | 'outline' (bordered) | 'outline-danger' | 'outline-success'
export default function Button({
  title,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  small,
  block,
  type = 'button',
  style,
  className: extraClassName,
}) {
  const variantClass =
    {
      primary: 'btn-primary',
      accent: 'btn-accent',
      outline: 'btn-outline',
      'outline-danger': 'btn-outline-danger',
      'outline-success': 'btn-outline-success',
    }[variant] || 'btn-primary';

  const className = [
    'btn',
    variantClass,
    small && 'btn-small',
    block && 'btn-block',
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={className} disabled={disabled || loading} onClick={onClick} style={style}>
      {loading ? '…' : title}
    </button>
  );
}
