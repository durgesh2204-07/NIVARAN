# Nivaran Operational Runbook & Graceful Degradation Matrix (`docs/RUNBOOK.md`)

This runbook documents the graceful degradation matrix, failure detection indicators, and recovery procedures for SEOC / DEOC duty officers and platform engineers.

---

## 1. Graceful Degradation Matrix (Section 9.3)

| Dependency / Subsystem | Failure Condition | Automatic Client Fallback | User-Visible Indicator |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Weather API** | Timeout (>6 s), HTTP 5xx, or Circuit Open | Uses cached SWR weather + historical monsoon baseline factor | Warning strip: `"Live rainfall unavailable — using historical baseline."` |
| **USGS Seismic GeoJSON Feed** | Timeout, HTTP 5xx, or Circuit Open | Switches to seeded Koyna-Warna / Western Ghats baseline seismic catalogue | Status chip in Zone C / GIS layer panel: `"Seismic feed degraded"` |
| **Nominatim Gazetteer** | Rate-limited (429) or unreachable | Searches local seeded habitations, shelters, incidents, and coordinate pairs (`lat, lng`) | Search bar note: `"External place search unavailable · Searching local registry"` |
| **OSRM Routing Engine** | Unreachable or route calculation error | Computes Turf.js geodesic straight-line corridor, distance (km), and bearing to nearest shelter | Route badge: `"Direct corridor (OSRM offline)"` |
| **AWS Terrarium 3D DEM / WebGL** | DEM tiles fail or `webglcontextlost` fired | Automatically switches MapLibre engine to 2D mode; attempts restore on `webglcontextrestored` | Top map strip: `"3D DEM unavailable — automatic 2D fallback active."` |
| **Basemap Raster Tiles** | Primary satellite/OSM tile server unreachable | Switches to alternate basemap; vector hazard polygons, extrusions, and shelters remain rendered | Map strip: `"Map tiles unavailable · Vector layers active"` |
| **Browser Geolocation** | Permission denied, timeout, or insecure context | Enables manual map pin placement and village/taluka selector | Inline notice with manual pin button |
| **IndexedDB / Local Storage** | Blocked by private browsing or quota exceeded | Falls back to in-memory `Map` queue (`isOfflineStorageInMemoryFallback()`) | Top bar warning: `"Storage restricted · Using in-memory session queue"` |
| **Service Worker** | Unsupported or registration blocked | App operates online-only with zero runtime errors | System status indicator |
| **Field Telemetry Sensor** | No reading received for >15 minutes | Marks sensor `"No signal"` with last valid timestamp and raises maintenance task | Red/amber `"No signal"` badge on sensor card |
| **Whole Backend Unreachable** | `/api/*` circuit breaker open or device offline | Enters Read-Only cached mode; mutations (SOS, hazard reports) enqueue in IndexedDB with idempotency keys | Persistent top bar `Offline` / `Reconnecting` pill + queue counter |

---

## 2. Common Failure Scenarios & Recovery Steps

### Scenario A: Circuit Breaker Opens on Weather or Routing Feed
1. **Detection**: In `/settings` (Administration → System Status) or the Zone C footer strip, the dependency indicator shows `OPEN` (red dot) after 5 consecutive failures.
2. **Automatic Probe**: After 30 seconds, [`apiClient.ts`](file:///c:/Users/Durgesh/Downloads/pccoe/src/resilience/apiClient.ts) transitions the circuit to `HALF-OPEN` and sends a single probe request.
3. **Manual Recovery**: If an upstream endpoint is experiencing a prolonged outage during monsoon operations, toggle the corresponding kill switch in `/settings` to suppress retry noise and lock the platform onto verified IMD/GSI seeded baselines.

### Scenario B: Queued SOS or Field Hazard Reports Stuck in `Failed` State
1. **Detection**: The top navigation bar shows pending items in the offline sync badge.
2. **Recovery**:
   - Verify network connectivity (`Online` pill in top bar).
   - Click **Sync Offline Queue** in Community Reporting or Citizen Portal. Every queued item carries a deterministic `idempotencyKey` (`sos-...` or `rep-...`), so retrying will never create duplicate dispatches.
   - **Life-Safety Rule**: If an SOS cannot be delivered within 10 seconds, the UI immediately instructs the user: `"Not delivered. Call 112 now."` with a direct `tel:112` action.

### Scenario C: Broken SHA-256 Hash Chain in Relocation Case Ledger
1. **Detection**: On `/relocation-tracker`, clicking **Verify Ledger Hash Chain** reports `"Record integrity: check failed"` and logs a `SECURITY_HASH_MISMATCH` audit event.
2. **Recovery**:
   - Inspect the flagged household case ID and compare its `prevHash` against the preceding record's `recordHash`.
   - Restore the last verified dataset snapshot from `/data-management` (Scheduled Backups & Restore Points) and notify the State Relief Commissioner.
