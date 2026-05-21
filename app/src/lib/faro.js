import {
  initializeFaro,
  getWebInstrumentations,
  LogLevel,
} from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

let faroInstance = null;

export function initFaro() {
  if (faroInstance || typeof window === 'undefined') return faroInstance;

  // Prioritas URL:
  // 1. window.FARO_COLLECTOR_URL → diinjek runtime dari env K8s (docker-entrypoint.sh)
  // 2. /faro/collect             → nginx proxy ke alloy.monitoring.svc:12347 (default)
  //
  // Alloy LoadBalancer external IP kamu: 20.115.192.181:12347
  // Tapi dari DALAM cluster (pod nginx), lebih baik pakai service DNS:
  //   alloy.monitoring.svc.cluster.local:12347
  // Nginx di pod rum-shop yang proxy dari /faro/collect ke Alloy service
  const collectorUrl =
    (typeof window !== 'undefined' && window.FARO_COLLECTOR_URL &&
      window.FARO_COLLECTOR_URL !== '%FARO_COLLECTOR_URL%')
      ? window.FARO_COLLECTOR_URL
      : '/faro/collect';

  faroInstance = initializeFaro({
    url: collectorUrl,
    app: {
      name: 'rum-shop-demo',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
    },
    sessionTracking: {
      enabled: true,
      persistent: true,
    },
    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: true,
        captureConsoleDisabledLevels: [],
      }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [/.*/],
        },
      }),
    ],
  });

  return faroInstance;
}

export function getFaro() {
  return faroInstance;
}

// ── Custom event helpers ────────────────────────────────────────────────────

export function trackPageView(pageName, attributes = {}) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushEvent('page_view', { page: pageName, ...attributes });
}

export function trackAddToCart(product) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushEvent('add_to_cart', {
    product_id: String(product.id),
    product_name: product.name,
    price: String(product.price),
    category: product.category,
  });
}

export function trackCheckout(cartItems, total) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushEvent('checkout_initiated', {
    item_count: String(cartItems.length),
    total_value: String(total),
    items: cartItems.map((i) => i.name).join(','),
  });
}

export function trackPurchase(orderId, total) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushEvent('purchase_completed', {
    order_id: orderId,
    total_value: String(total),
    timestamp: new Date().toISOString(),
  });
}

export function trackError(message, context = {}) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushError(new Error(message), { context });
}

export function setUser(userId, username) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.setUser({ id: userId, username, attributes: {} });
}

export function pushLog(message, level = LogLevel.INFO, context = {}) {
  const faro = getFaro();
  if (!faro) return;
  faro.api.pushLog([message], { level, context });
}
