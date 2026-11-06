# Nivaran Browser Hardening & HTTP Security Headers (`security.headers.md`)

All production deployments (Nginx, Cloudflare Pages, Netlify, NIC Cloud Load Balancer) MUST emit the following HTTP response headers on `/*`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://server.arcgisonline.com https://*.tile.openstreetmap.org https://*.tile.opentopomap.org https://tiles.openfreemap.org https://s3.amazonaws.com; connect-src 'self' https://api.open-meteo.com https://earthquake.usgs.gov https://nominatim.openstreetmap.org https://router.project-osrm.org https://s3.amazonaws.com https://tiles.openfreemap.org; worker-src 'self' blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self), microphone=(self), payment=(), usb=()
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
```

## Origin Synchronisation
Allowed third-party origins are centrally defined in [`src/security/origins.ts`](file:///c:/Users/Durgesh/Downloads/pccoe/src/security/origins.ts) so runtime `connect-src` / `img-src` policies and `public/_headers` remain strictly synchronised.
