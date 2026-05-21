import React, { useEffect, useState } from 'react';
import { trackPageView, trackPurchase, pushLog, trackError } from '../lib/faro';

export default function Checkout({ cart, setCart, onBack }) {
  const [step, setStep] = useState('form'); // form | processing | success
  const [orderId, setOrderId] = useState(null);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    trackPageView('checkout', { total_value: String(total) });
    pushLog('Checkout page loaded', 'INFO');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('processing');
    pushLog('Payment processing started', 'INFO', { total: String(total) });

    // Simulate payment delay (triggers distributed trace)
    await new Promise((r) => setTimeout(r, 1800));

    // Simulate occasional payment failure for error tracking demo
    if (Math.random() < 0.15) {
      trackError('Payment gateway timeout', { step: 'payment', total: String(total) });
      pushLog('Payment failed — gateway timeout', 'ERROR', { total: String(total) });
      setStep('form');
      alert('❌ Pembayaran gagal (15% chance — dikirim ke error tracking Faro)\nCoba lagi!');
      return;
    }

    const oid = 'ORD-' + Date.now().toString(36).toUpperCase();
    setOrderId(oid);
    trackPurchase(oid, total);
    pushLog('Purchase completed', 'INFO', { order_id: oid, total: String(total) });
    setCart([]);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="checkout-success">
        <div className="success-icon">🎉</div>
        <h2>Pesanan Berhasil!</h2>
        <p className="order-id">Order ID: <strong>{orderId}</strong></p>
        <p>Event <code>purchase_completed</code> telah dikirim ke Grafana Faro</p>
        <button className="btn-primary" onClick={onBack}>Belanja Lagi</button>

        <div className="rum-legend">
          <h3>📊 RUM Events dikirim:</h3>
          <ul>
            <li><code>purchase_completed</code> dengan order_id & total_value</li>
            <li>Distributed trace dari klik → simulasi API payment</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Informasi Pengiriman</h2>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input type="text" defaultValue="Demo User" required />
          </div>
          <div className="form-group">
            <label>Alamat</label>
            <input type="text" defaultValue="Jl. Grafana No. 1, Jakarta" required />
          </div>
          <div className="form-group">
            <label>Telepon</label>
            <input type="tel" defaultValue="08123456789" required />
          </div>

          <h2>Pembayaran</h2>
          <div className="form-group">
            <label>Metode</label>
            <select defaultValue="transfer">
              <option value="transfer">Transfer Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="cod">COD</option>
            </select>
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={step === 'processing'}>
            {step === 'processing' ? '⏳ Memproses...' : `Bayar Rp ${total.toLocaleString('id-ID')}`}
          </button>
          <p className="error-note">⚠️ 15% chance error (untuk demo error tracking)</p>
        </form>

        <div className="order-summary">
          <h2>Ringkasan</h2>
          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.emoji} {item.name} ×{item.qty}</span>
              <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total</strong>
            <strong>Rp {total.toLocaleString('id-ID')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
