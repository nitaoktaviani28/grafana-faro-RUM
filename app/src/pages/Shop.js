import React, { useEffect, useState } from 'react';
import { trackPageView, trackAddToCart, pushLog } from '../lib/faro';

const PRODUCTS = [
  { id: 1, name: 'Sneakers Pro X', price: 450000, category: 'Sepatu', emoji: '👟', stock: 5 },
  { id: 2, name: 'Kemeja Casual Slim', price: 185000, category: 'Pakaian', emoji: '👕', stock: 12 },
  { id: 3, name: 'Tas Ransel Urban', price: 320000, category: 'Tas', emoji: '🎒', stock: 3 },
  { id: 4, name: 'Topi Baseball', price: 95000, category: 'Aksesoris', emoji: '🧢', stock: 8 },
  { id: 5, name: 'Jam Tangan Classic', price: 750000, category: 'Aksesoris', emoji: '⌚', stock: 2 },
  { id: 6, name: 'Celana Chino', price: 230000, category: 'Pakaian', emoji: '👖', stock: 7 },
];

export default function Shop({ cart, setCart }) {
  const [filter, setFilter] = useState('Semua');
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    trackPageView('shop', { product_count: String(PRODUCTS.length) });
    pushLog('Shop page loaded', 'INFO');
  }, []);

  const categories = ['Semua', ...new Set(PRODUCTS.map((p) => p.category))];
  const filtered = filter === 'Semua' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    trackAddToCart(product);
    pushLog(`Added to cart: ${product.name}`, 'INFO', { product_id: String(product.id) });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const inCart = (id) => cart.find((i) => i.id === id);

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Katalog Produk</h1>
        <p className="subtitle">Assessment Grafana Faro RUM — setiap interaksi dikirim ke LGTM Stack</p>
      </div>

      <div className="category-filter">
        {categories.map((c) => (
          <button key={c} className={filter === c ? 'cat-btn active' : 'cat-btn'} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filtered.map((product) => (
          <div key={product.id} className={`product-card ${addedId === product.id ? 'flash' : ''}`}>
            <div className="product-emoji">{product.emoji}</div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>
              <p className="product-stock">Stok: {product.stock}</p>
            </div>
            <button
              className={`btn-cart ${inCart(product.id) ? 'in-cart' : ''}`}
              onClick={() => addToCart(product)}
            >
              {inCart(product.id) ? `✓ ${inCart(product.id).qty} di keranjang` : 'Tambah ke Keranjang'}
            </button>
          </div>
        ))}
      </div>

      <div className="rum-legend">
        <h3>📊 RUM Events yang dikirim ke Faro:</h3>
        <ul>
          <li><code>page_view</code> — saat halaman ini dibuka</li>
          <li><code>add_to_cart</code> — saat tombol "Tambah" diklik</li>
          <li><strong>Web Vitals</strong> — LCP, CLS, FID otomatis dikumpulkan</li>
        </ul>
      </div>
    </div>
  );
}
