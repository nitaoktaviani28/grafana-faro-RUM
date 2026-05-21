# 🛍️ RUM Shop — Grafana Faro Assessment

Aplikasi demo e-commerce untuk assessment **Grafana Faro RUM** yang terintegrasi dengan **LGTM-FP Stack** di Kubernetes, menggunakan **Grafana Alloy** sebagai agent. contoh

## Arsitektur

```
Browser (React App)
  │
  │  Faro SDK  (beacon HTTP POST)
  ▼
nginx /faro/collect  ←── proxy (menghindari CORS)
  │
  ▼
Alloy faro.receiver :12347  (namespace: monitoring)
  │
  ├──► loki.write ──────────► Loki       (logs, errors, events, web vitals)
  ├──► otelcol.exporter.otlp ► Tempo      (distributed traces, session spans)
  └──► prometheus.remote_write ► Mimir    (metrics aggregasi)
```

## RUM Data yang dikumpulkan

| Kategori | Data |
|---|---|
| **Web Vitals** | LCP, CLS, FID (otomatis oleh Faro SDK) |
| **Errors** | JS exceptions + stack trace |
| **Custom Events** | `page_view`, `add_to_cart`, `checkout_initiated`, `purchase_completed` |
| **Session Tracking** | Session ID persistent, user ID |
| **Traces** | Page navigation spans, custom spans |

---

## Setup

### 1. Build & Push Docker Image

```bash
cd app/
docker build -t your-registry/rum-shop:latest .
docker push your-registry/rum-shop:latest
```

> Ganti `your-registry` dengan registry kamu (ECR, GCR, Harbor, dll)

### 2. Deploy Aplikasi ke Kubernetes

```bash
# Edit image di deployment.yaml dulu
vim k8s/app/deployment.yaml
# Cari: image: your-registry/rum-shop:latest
# Ganti dengan image yang sudah kamu push

# Edit hostname di ingress.yaml
vim k8s/app/ingress.yaml
# Cari: host: rum-shop.example.com
# Ganti dengan hostname kamu

# Apply
kubectl apply -f k8s/app/
```

### 3. Konfigurasi Alloy — Tambah Faro Receiver

```bash
# Tambahkan port 12347 ke Alloy service
kubectl apply -f k8s/alloy/alloy-service-patch.yaml

# Tambahkan rum.alloy ke konfigurasi Alloy yang sudah ada
# PILIHAN A: Jika Alloy pakai single ConfigMap
kubectl -n monitoring get configmap alloy-config -o yaml > alloy-existing.yaml
# Tambahkan konten dari k8s/alloy/alloy-rum-configmap.yaml (bagian rum.alloy)
# lalu apply kembali

# PILIHAN B: Jika Alloy pakai --config.extra-env-file atau mount multi-file
kubectl apply -f k8s/alloy/alloy-rum-configmap.yaml
# Tambahkan volume mount di Alloy Deployment:
# volumes:
#   - name: rum-config
#     configMap:
#       name: alloy-rum-config
# volumeMounts:
#   - name: rum-config
#     mountPath: /etc/alloy/rum.alloy
#     subPath: rum.alloy
```

#### Jika pakai Helm (Grafana Alloy chart)

```yaml
# values-alloy-patch.yaml
alloy:
  configMap:
    content: |
      # ... existing config ...
      # Tambahkan konten rum.alloy di sini

  extraPorts:
    - name: faro
      port: 12347
      targetPort: 12347
      protocol: TCP
```

```bash
helm upgrade alloy grafana/alloy -n monitoring -f values-alloy-patch.yaml
```

### 4. Verifikasi Alloy Faro Receiver

```bash
# Cek Alloy logs untuk konfirmasi faro.receiver berjalan
kubectl -n monitoring logs -l app.kubernetes.io/name=alloy --tail=50 | grep -i faro

# Port-forward untuk test langsung
kubectl -n monitoring port-forward svc/alloy 12347:12347 &
curl -X POST http://localhost:12347/collect \
  -H "Content-Type: application/json" \
  -d '{"traces":{"resourceSpans":[]},"logs":[],"exceptions":[],"measurements":[],"events":[],"meta":{"sdk":{"name":"@grafana/faro-web-sdk","version":"1.0.0"},"app":{"name":"test","version":"1.0.0","environment":"test"},"page":{"url":"http://localhost"}}}'
# Harus return HTTP 202
```

### 5. Import Grafana Dashboard

1. Buka Grafana → **Dashboards** → **Import**
2. Upload file `grafana-dashboard.json`
3. Pilih **Loki datasource** yang sudah terhubung ke Loki kamu
4. Klik **Import**

---

## Verifikasi di Grafana

### Explore Loki
```logql
# Semua Faro events
{source="faro", app="rum-shop"}

# Hanya errors
{source="faro", app="rum-shop"} | json | kind="exception"

# Custom events add_to_cart
{source="faro", app="rum-shop"} | json | kind="event" | event_name="add_to_cart"

# Web Vitals LCP
{source="faro", app="rum-shop"} | json | kind="measurement" | measurement_type="lcp"
```

### Explore Tempo
- Cari trace dengan service name: `rum-shop-demo`
- Lihat spans: `faro.page_view`, `faro.session`, custom spans dari Faro SDK

---

## Struktur File

```
rum-assessment/
├── app/
│   ├── src/
│   │   ├── lib/faro.js          # Faro SDK init + helper functions
│   │   ├── App.js               # Root component
│   │   ├── App.css              # Styling
│   │   └── pages/
│   │       ├── Shop.js          # Katalog produk
│   │       ├── Cart.js          # Keranjang
│   │       └── Checkout.js      # Checkout + payment simulation
│   ├── public/index.html        # Runtime config injection
│   ├── Dockerfile               # Multi-stage build
│   ├── nginx.conf               # Proxy /faro/collect → Alloy
│   ├── docker-entrypoint.sh     # Runtime env var injection
│   └── package.json
├── k8s/
│   ├── app/
│   │   ├── deployment.yaml      # Deployment + Service + ConfigMap
│   │   └── ingress.yaml         # Nginx Ingress
│   └── alloy/
│       ├── alloy-rum-configmap.yaml  # Konfigurasi faro.receiver pipeline
│       └── alloy-service-patch.yaml  # Tambah port 12347 + NetworkPolicy
└── grafana-dashboard.json        # Dashboard siap import
```

---

## Troubleshooting

| Masalah | Cek |
|---|---|
| Faro beacon tidak terkirim | Browser DevTools → Network → cari POST ke `/faro/collect` |
| 502 di `/faro/collect` | `kubectl -n monitoring get svc alloy` — pastikan port 12347 ada |
| Tidak ada data di Loki | `kubectl -n monitoring logs -l app=alloy` — cek error faro receiver |
| CORS error di browser | Pastikan `nginx.conf` proxy sudah benar, cek Access-Control headers |
| Traces tidak muncul di Tempo | Cek `otelcol.exporter.otlp` di Alloy config — verifikasi endpoint Tempo |
