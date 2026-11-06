# Nivaran Resilience & Security Verification Checklist (`docs/TESTING.md`)

Run automated unit tests at any time with:

```bash
npm run test
npm run check:secrets
npm run build
```

In development mode (`npm run dev`), use the **Fault Injection (DEV)** button in the bottom-right corner to simulate network failures, latency, HTTP errors, and dependency outages without modifying code.

---

## Manual Verification Checklist (Section 9.6)

- [ ] **1. Network Off (Offline Mode)**
  - Toggle **Force Offline Mode** in the Fault Injection panel (or DevTools → Network → Offline).
  - Trigger an **Emergency SOS** (hold 3 seconds) on `/login`: verify it queues in IndexedDB, displays `"Queued. Call 112 now."` with a working `tel:112` button, and syncs automatically when connectivity returns.
  - Submit a **Report a Hazard** form while offline: verify it enters the offline queue with status `Queued` and uploads without duplication when back online.

- [ ] **2. Slow 3G / High Latency (1200 ms – 4000 ms)**
  - Set **Artificial Latency** to `4000 ms` in the Fault Injection panel.
  - Navigate across lazy-loaded routes and trigger weather/elevation queries: verify skeleton loaders appear immediately and every loading state resolves within the 15-second ceiling.

- [ ] **3. Upstream API Returning HTTP 500 / 429 / Malformed JSON**
  - Set **API Failure Mode** to `HTTP 500`, `HTTP 429`, or `Malformed JSON`.
  - Verify `apiClient.ts` retries idempotent `GET` requests with backoff, trips the host circuit breaker after 5 consecutive failures, and serves Stale-While-Revalidate cached data with `"Last updated HH:MM IST · Retrying"`.

- [ ] **4. Blocked Geolocation**
  - Block location permission in browser site settings and click **Locate Me** on `/gis` or **Use My Location** on `/login`.
  - Verify a clear permission-denied message is shown and manual pin / village search fallback remains fully functional.

- [ ] **5. WebGL / 3D Terrain Tiles Disabled**
  - Toggle **Disable 3D DEM Tiles** in the Fault Injection panel (or switch to 2D mode on `/gis`).
  - Verify MapLibre GL JS displays the `"3D DEM unavailable — displaying 2D mode"` notice while keeping all habitation polygons, shelters, and click-to-query popups interactive.

- [ ] **6. Storage Disabled (Private Mode / Quota Exceeded)**
  - Block site data / IndexedDB in browser settings.
  - Verify `offlineQueue.ts` automatically falls back to `memoryFallbackQueue` (`isOfflineStorageInMemoryFallback() === true`) without throwing unhandled exceptions.

- [ ] **7. Expired Session & Idle Timeout**
  - Sign in as any authority role and trigger the idle session warning or click **Sign Out**.
  - Verify sign-out clears the in-memory access token, purges the IndexedDB offline queue, and redirects protected routes to `/login`.

- [ ] **8. Double-Submitted Forms & Abuse Rate Limits**
  - Trigger Emergency SOS twice within 2 minutes: verify the second attempt is blocked by the 2-minute rate budget and offers **Send Update** on the active SOS reference instead of creating a duplicate dispatch.
  - Enter an incorrect password/OTP 5 times on `/login`: verify the account locks for 15 minutes with `"Account locked after 5 failed attempts"`.

- [ ] **9. Oversized & Hostile File Uploads**
  - On `/data-management` or `/login` (Partner Access Request), test uploading a file >25 MB, a `.exe` file, or a `.kml` containing `<!ENTITY xxe SYSTEM "file:///etc/passwd">`.
  - Verify `validateUploadFile()` rejects the file before parsing.

- [ ] **10. Hostile Text & CSV Formula Injection**
  - Enter `<script>alert(1)</script>` or `=CMD|' /C calc'!A0` into any report description, incident note, or search bar.
  - Verify HTML tags are stripped via `sanitizeInput()` and exported CSV cells starting with `=`, `+`, `-`, `@` are prefixed with `'` via `escapeCsvCell()`.
