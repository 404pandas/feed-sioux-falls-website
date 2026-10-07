import React, { useEffect, useRef } from 'react';
import Icon from './Icon';

// A panel that slides over the page for viewing or editing one thing.
// Full screen on phones, a side panel on computers. Esc or the X closes it;
// focus moves into it when it opens and back when it closes.
export default function Drawer({ title, onClose, children, footer }) {
  const panelRef = useRef(null);
  // Kept in a ref so re-renders of the page (typing in a field) don't
  // re-run the open/close effect and yank focus back to the top.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    panelRef.current?.querySelector('input, select, textarea, button')?.focus();
    function onKey(e) {
      if (e.key === 'Escape') closeRef.current();
    }
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={title} ref={panelRef}>
        <div className="drawer-head">
          <h2 className="h2" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {title}
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}
