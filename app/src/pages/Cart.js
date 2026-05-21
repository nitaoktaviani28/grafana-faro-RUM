import React, { useEffect } from 'react';
import { trackPageView, trackCheckout, pushLog } from '../lib/faro';

export default function Cart({ cart, setCart, onCheckout, onBack }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    trackPageView('cart', { item_count: String(cart.length), total_value: String(total) });
    pushLog('Cart page loaded', 'INFO', { items: cart.length });
  }, []);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const handleCheckout = () => {
    trackCheckout(cart, total);
    pushLog('Checkout initiated', 'INFO', { total: String(total) });
    onCheckout();
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-icon">🛒</div>
        <h2>Keranjang kosong</h2>
        <button className="btn-primary" onClick={onBack}>← Kembali Belanja</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Keranjang Belanja</h1>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <span className="item-emoji">{item.emoji}</span>
            <div className="item-info">
              <h3>{item.name}</h3>
              <span className="item-category">{item.category}</span>
            </div>
            <div className="item-qty">
              <button onClick={() => updateQty(item.id, -1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
            <div className="item-price">Rp {(item.price * item.qty).toLocaleString('id-ID')}</div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row total">
          <span>Total</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <div className="cart-actions">
          <button className="btn-secondary" onClick={onBack}>← Lanjut Belanja</button>
          <button className="btn-primary" onClick={handleCheckout}>Checkout →</button>
        </div>
      </div>

      <div className="rum-legend">
        <h3>📊 RUM Events dikirim:</h3>
        <ul>
          <li><code>page_view</code> dengan item_count & total_value</li>
          <li><code>checkout_initiated</code> saat tombol Checkout diklik</li>
        </ul>
      </div>
    </div>
  );
}
