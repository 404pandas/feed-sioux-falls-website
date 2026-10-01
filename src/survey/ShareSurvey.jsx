import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Button from '../components/Button';

export function surveyUrl() {
  return `${window.location.origin}/survey`;
}

// Generates the QR code on the device - no third-party QR service, so
// nobody else learns who's looking at the survey.
export function useQrDataUrl(url, size = 320) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: size, margin: 2, errorCorrectionLevel: 'M' })
      .then((result) => !cancelled && setDataUrl(result))
      .catch(() => !cancelled && setDataUrl(''));
    return () => {
      cancelled = true;
    };
  }, [url, size]);
  return dataUrl;
}

// "Know someone who should fill this out?" - one big share button that
// opens the phone's own share sheet (texting, Facebook, Messenger,
// WhatsApp... whatever they have), plus fallbacks and a QR code.
export default function ShareSurvey({ ui }) {
  const url = surveyUrl();
  const message = `${ui.shareMessage} ${url}`;
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const qr = useQrDataUrl(url);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function nativeShare() {
    try {
      await navigator.share({ title: ui.shareEmailSubject, text: ui.shareMessage, url });
    } catch {
      // They closed the share sheet - nothing to do.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(ui.copyLink, url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);

  return (
    <section className="card survey-share no-print" aria-labelledby="survey-share-title">
      <p className="h2" id="survey-share-title">
        {ui.shareTitle}
      </p>

      {canNativeShare && (
        <Button title={ui.shareButton} variant="accent" onClick={nativeShare} block style={{ marginTop: 'var(--space-md)' }} />
      )}

      <div className="survey-share-links">
        {/* "sms:?&body=" is the form both iOS and Android accept. */}
        <a className="btn btn-outline btn-small" href={`sms:?&body=${encodedMessage}`}>
          {ui.shareText}
        </a>
        <a className="btn btn-outline btn-small" href={`mailto:?subject=${encodeURIComponent(ui.shareEmailSubject)}&body=${encodedMessage}`}>
          {ui.shareEmail}
        </a>
        <a
          className="btn btn-outline btn-small"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          className="btn btn-outline btn-small"
          href={`https://x.com/intent/post?text=${encodeURIComponent(ui.shareMessage)}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </a>
        <button type="button" className="btn btn-outline btn-small" onClick={copyLink}>
          {copied ? ui.copied : ui.copyLink}
        </button>
        <button type="button" className="btn btn-outline btn-small" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          {showQr ? ui.hideQr : ui.showQr}
        </button>
      </div>
      <p className="sr-only" role="status">
        {copied ? ui.copied : ''}
      </p>

      {showQr && qr && (
        <div className="survey-qr">
          <img src={qr} alt={`QR code: ${url}`} width={280} height={280} />
          <p className="body-muted">{ui.qrHint}</p>
        </div>
      )}
    </section>
  );
}
