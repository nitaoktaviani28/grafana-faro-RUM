import React, { useEffect, useState } from 'react';
import { initFaro, setUser, pushLog, trackError } from './lib/faro';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import './App.css';

export default function App() {
  const [page, setPage] = useState('shop');
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Init Faro on mount
    initFaro();
    // Simulate a logged-in user for session tracking
    const uid = 'user-' + Math.random().toString(36).slice(2, 8);
    setUser(uid, 'demo-user');
    pushLog('App initialized', 'INFO', { uid });
  }, []);

  const handleNav = (p) => {
    setPage(p);
    pushLog(`Navigate to ${p}`, 'INFO');
  };

  const triggerError = () => {
    try {
      throw new Error('[RUM Demo] Simulated JS error for assessment');
    } catch (e) {
      trackError(e.message, { source: 'manual_trigger', page });
      alert('Error telah dikirim ke Grafana Faro!\nCek Grafana → Explore → Loki/Tempo');
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">🛍️ RUM Shop</div>
        <div className="nav-links">
          <button className={page === 'shop' ? 'active' : ''} onClick={() => handleNav('shop')}>Toko</button>
          <button className={page === 'cart' ? 'active' : ''} onClick={() => handleNav('cart')}>
            Keranjang {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
        </div>
        <button className="btn-error-trigger" onClick={triggerError} title="Kirim error ke Faro">
          ⚡ Trigger Error
        </button>
      </nav>

      <main>
        {page === 'shop' && (
          <Shop cart={cart} setCart={setCart} onCheckout={() => handleNav('cart')} />
        )}
        {page === 'cart' && (
          <Cart cart={cart} setCart={setCart} onCheckout={() => handleNav('checkout')} onBack={() => handleNav('shop')} />
        )}
        {page === 'checkout' && (
          <Checkout cart={cart} setCart={setCart} order={order} setOrder={setOrder} onBack={() => handleNav('shop')} />
        )}
      </main>
    </div>
  );
}
