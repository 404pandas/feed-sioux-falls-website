import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Card from './Card';
import Button from './Button';
import { api } from '../api/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const CATEGORIES = [
  { value: 'contact', label: 'General' },
  { value: 'assistance', label: 'I need help' },
  { value: 'donate', label: 'Donation question' },
  { value: 'partner', label: 'Partner with us' },
  { value: 'suggestion', label: 'Suggestion' },
];

// Matches the price tiers set up in the Stripe dashboard - shown here purely
// as quick-select buttons. They don't reference those Stripe Price objects;
// clicking one just fills in the amount field, which still goes through the
// same arbitrary-amount PaymentIntent flow as a hand-typed amount.
const PRESET_AMOUNTS = [
  { value: 5, label: '$5' },
  { value: 10, label: '$10' },
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 200, label: '$200' },
  { value: 300, label: '$300' },
  { value: 2800, label: '$2,800', description: 'Restocks supplies for a full month' },
];

// The donate + contact forms, shared by the guest home page (public, no
// login) and the neighbor home page (logged-in neighbors) - both hit the
// same public API routes regardless of who's viewing them.
export default function SupportForms() {
  return (
    <>
      <DonateCard />
      <ContactCard />
    </>
  );
}

function DonateCard() {
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleContinue() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < 1) {
      setError('Please enter a donation amount of at least $1.');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const { clientSecret: secret } = await api.createPaymentIntent(
        parsedAmount,
        donorName || undefined,
        donorEmail || undefined
      );
      setClientSecret(secret);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleSuccess() {
    setDone(true);
    setClientSecret(null);
    setAmount('');
    setDonorName('');
    setDonorEmail('');
  }

  if (done) {
    return (
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <p className="h2">Thank you!</p>
        <p className="body-muted" style={{ marginTop: 'var(--space-xs)' }}>
          Your donation was received.
        </p>
        <Button title="Make Another Donation" variant="outline" onClick={() => setDone(false)} style={{ marginTop: 'var(--space-md)' }} />
      </Card>
    );
  }

  if (clientSecret) {
    return (
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
          Complete Your ${amount} Donation
        </p>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <DonatePaymentForm onSuccess={handleSuccess} onCancel={() => setClientSecret(null)} />
        </Elements>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 'var(--space-lg)' }}>
      <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
        Make a Donation
      </p>

      <label className="field-label">Amount (USD)</label>
      <div className="row-wrap gap-xs" style={{ marginBottom: 'var(--space-sm)' }}>
        {PRESET_AMOUNTS.map((preset) => (
          <Button
            key={preset.value}
            title={preset.label}
            small
            variant={amount === String(preset.value) ? 'primary' : 'outline'}
            onClick={() => setAmount(String(preset.value))}
          />
        ))}
      </div>
      {amount === String(PRESET_AMOUNTS[PRESET_AMOUNTS.length - 1].value) && (
        <p className="body-muted" style={{ marginBottom: 'var(--space-sm)' }}>
          {PRESET_AMOUNTS[PRESET_AMOUNTS.length - 1].description}
        </p>
      )}
      <input
        className="field-input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="Or enter a custom amount"
      />

      <label className="field-label">Your name (optional)</label>
      <input className="field-input" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Jane Doe" />

      <label className="field-label">Email (optional)</label>
      <input
        className="field-input"
        value={donorEmail}
        onChange={(e) => setDonorEmail(e.target.value)}
        placeholder="jane@example.com"
        type="email"
      />

      {!!error && (
        <p className="body-muted" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>
          {error}
        </p>
      )}

      <Button
        title="Continue to Payment"
        variant="accent"
        loading={creating}
        onClick={handleContinue}
        style={{ marginTop: 'var(--space-md)' }}
        block
      />
    </Card>
  );
}

function DonatePaymentForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError('');
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handlePay}>
      <PaymentElement />
      {!!error && (
        <p className="body-muted" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>
          {error}
        </p>
      )}
      <div className="row gap-sm" style={{ marginTop: 'var(--space-md)' }}>
        <Button title="Back" variant="outline" onClick={onCancel} disabled={submitting} />
        <Button title="Donate" variant="accent" type="submit" loading={submitting} disabled={!stripe} />
      </div>
    </form>
  );
}

function ContactCard() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('contact');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      setError('Please include a message before sending.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await api.submitContact({
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        message,
        category,
      });
      setSent(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setCategory('contact');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
        Contact Us
      </p>

      {sent && (
        <p className="body-text" style={{ color: 'var(--color-success)', marginBottom: 'var(--space-sm)' }}>
          Message sent - thanks for reaching out, someone will follow up soon.
        </p>
      )}

      <label className="field-label">What's this about?</label>
      <div className="row-wrap gap-xs" style={{ marginBottom: 'var(--space-sm)' }}>
        {CATEGORIES.map((c) => (
          <Button
            key={c.value}
            title={c.label}
            small
            variant={category === c.value ? 'primary' : 'outline'}
            onClick={() => setCategory(c.value)}
          />
        ))}
      </div>

      <label className="field-label">Name (optional)</label>
      <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

      <label className="field-label">Phone (optional)</label>
      <input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(605) 555-0100" type="tel" />

      <label className="field-label">Email (optional)</label>
      <input className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />

      <label className="field-label">Message</label>
      <textarea
        className="field-textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can we help?"
        rows={4}
      />

      {!!error && (
        <p className="body-muted" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>
          {error}
        </p>
      )}

      <Button title="Send Message" loading={sending} onClick={handleSubmit} style={{ marginTop: 'var(--space-md)' }} block />
    </Card>
  );
}
