# NIVARAN GIS 2.0 — Disaster Resilience & Relocation Planning Platform

> **NIVARAN National Platform** | **Theme:** *Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations*  
> **Authority Context:** National Disaster Management Authority (NDMA) & State Disaster Management Authority (SDMA) Maharashtra, India  
> **Piloted Geography:** 25 disaster-monitored habitations and 8 rehabilitation townships across the Western Ghats (Raigad, Satara, Pune, Ratnagiri, Kolhapur, Sindhudurg).

---

## 🚀 1-Click Instant Zero-Error Deployment Links

Deploy this production-ready application instantly with preconfigured WebGL, MapLibre CSP, and SPA routing rewrites:

| Platform | Deployment Type | 1-Click Deploy URL | Live URL |
|---|---|---|---|
| **Netlify** | 1-Click Connect & Deploy | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/durgesh2204-07/NIVARAN) | [`https://nivarangis.netlify.app`](https://nivarangis.netlify.app) |
| **Vercel** | 1-Click Connect & Deploy | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/durgesh2204-07/NIVARAN) | Instant Vercel Edge CDN |
| **GitHub Pages** | Automated GitHub Actions | [Trigger GitHub Workflow](https://github.com/durgesh2204-07/NIVARAN/actions/workflows/deploy.yml) | [`https://durgesh2204-07.github.io/NIVARAN/`](https://durgesh2204-07.github.io/NIVARAN/) |

### Verified Deployment Configuration

- **Repository URL:** `https://github.com/durgesh2204-07/NIVARAN.git`
- **Branch:** `main`
- **Build Command:** `npm run build`
- **Publish / Output Directory:** `dist`
- **Node.js Version:** `20` (Configured in `netlify.toml` and `.github/workflows/deploy.yml`)
- **SPA Routing Configuration:** Handled automatically via `netlify.toml`, `public/_headers`, `public/_redirects`, and `vercel.json`

---

## 1. System Overview & Mission

**NIVARAN GIS 2.0** is an enterprise-grade, GIS-first geospatial decision support system (DSS) designed to help authorized government officials identify hazardous habitations, evaluate people and critical infrastructure exposed to risk, assess safe candidate relocation sites, calculate realistic carrying capacity under restrictive physical constraints, prioritize relocation needs, simulate planning scenarios, and track approved relocation cases from identification to resettlement.

The platform directly resolves the critical failure mode of traditional disaster management: **moving people before the disaster occurs, not in the wake of tragedy.**

---

## 2. 19 Master GIS Modules (Section 4 Specification)

The application shell provides a persistent 3-panel GIS command center and a collapsible 19-module Left Navigation Panel with role-based access control (RBAC), live status badges, and full multilingual support (English, Hindi, Marathi):

| # | Module Name | Route | Operational Functionality |
|---|---|---|---|
| **01** | **Command Center** | `/map` | 3-panel interactive MapLibre GIS command center with live GPS, 3D Terrarium terrain, CWC rivers, GSI faults, buffer analytics, and Decision Deck. |
| **02** | **GIS Explorer** | `/gis` | Multi-layer spatial inspection, spatial buffer generation, area-of-interest (AOI) drawing, and time-travel replay. |
| **03** | **Hazard Intelligence** | `/hazard-map` | Slope instability, landslide hazard zonation (LHZ), rainfall radar overlays, and satellite change-detection review. |
| **04** | **Red Zone Analysis** | `/dashboard` | Multi-hazard vulnerability analytics, high-risk habitation matrix, and 4-tier risk zone classification. |
| **05** | **Vulnerability Assessment** | `/vulnerability` | Demographic exposure (% elderly, % disabled, % BPL, kutcha houses), healthcare distance, and 2×2 policy matrix. |
| **06** | **Relocation Priority** | `/priority-ranking` | Multi-criteria ranking algorithm, urgency scoring, official relocation order PDF generation, and CSV exports. |
| **07** | **Safe-Zone Capacity** | `/relocation-sites` | MCDA candidate site evaluation, restrictive carrying capacity formula, and Digital Dress Rehearsal (+20 yr climate stress). |
| **08** | **Relocation Site Planner** | `/planning` | Automated housing layout generator, plot allotment grid, and essential infrastructure block planning. |
| **09** | **Digital Twin** | `/digital-twin` | High-resolution 3D elevation terrain, camera pitch/bearing controls, and flood inundation dynamic mesh. |
| **10** | **Scenario Simulator** | `/simulator` | What-if simulation: heavy rainfall, dam discharge, road disruption, and safe capacity reduction. |
| **11** | **Incident Reports** | `/incidents` | Real-time incident triage, field verification workflow (Submitted → Verified → Response Assigned → Resolved). |
| **12** | **Official Alerts** | `/alerts` | Red/Orange/Yellow/Green CAP alerts, geofenced cell broadcasts, and speech-transcribed voice advisories. |
| **13** | **Evacuation and Roads** | `/evacuation` | OSRM turn-by-turn routing, road closure overlays, transit hazard intersections, and safe corridor recommendations. |
| **14** | **Shelters and Resources** | `/resources` | IDRN inventory visibility, medical kits, food rations, relief camp occupancy, and stock thresholds. |
| **15** | **Volunteer Operations** | `/volunteers` | Registered volunteer directory, specialized skills (medical, rescue, boat, driver), and deployment zones. |
| **16** | **Relocation Case Tracking** | `/relocation-tracker` | Digital household case lifecycle: Identified → Approved → Compensation Paid → Site Allotted → Resettled with SHA-256 ledger. |
| **17** | **Reports and Analytics** | `/analytics` | Comprehensive disaster readiness reports, before/after impact comparison, KPI metrics, and printable audit logs. |
| **18** | **Data Sources and Imports** | `/data-sources` | Ingestion pipeline health (Bhuvan, IMD, CWC, USGS, OSM), telemetry freshness, and GeoJSON/Shapefile validation. |
| **19** | **Administration and Audit** | `/settings` | Immutable audit trail, role permissions, mock drill controls, and security compliance parameters. |
| **—** | **Citizen Safety Portal** | `/citizen-portal` | Public-facing safety dashboard, nearest shelter locator, safety guidelines, and Emergency SOS distress beacon. |

---

## 3. Core Mathematical & GIS Formulations (`src/utils/scoring.ts`)

### 1. Weighted Multi-Hazard Score
$$\text{Hazard Score} = w_r \cdot \text{Rainfall} + w_s \cdot \text{Slope} + w_h \cdot \text{History} + w_p \cdot \text{RiverProximity}$$
*Default Normalized Weights:* $w_r = 0.35,\ w_s = 0.30,\ w_h = 0.20,\ w_p = 0.15$  
- **Classification Cutoffs:**
  - **Red (Immediate):** $> 0.75$ — Urgent relocation planning required.
  - **Orange (Short-term):** $0.50 \le \text{Score} \le 0.75$ — Elevated risk, pre-monsoon relocation priority.
  - **Yellow (Medium-term / Watch):** $0.30 \le \text{Score} < 0.50$ — Structural mitigation and sensor monitoring.
  - **Green (Safe):** $< 0.30$ — Baseline lower assessed risk based on available evidence.

### 2. Restrictive Safe Carrying Capacity
$$\text{Safe Capacity (Households)} = \left\lfloor \frac{\text{Usable Area (ha)}}{\text{Space Standard (0.08 ha/HH)}} \right\rfloor \times \text{Water Reliability Score}$$
$$\text{Remaining Capacity} = \max\left(0,\ \text{Safe Capacity} - \text{Existing Occupied Households}\right)$$
- **Safety Rule:** Usable land area alone never guarantees capacity; water supply and sanitation constraints govern the operational limit to prevent overcrowding and secondary disasters.
- **Digital Dress Rehearsal:** Evaluates candidate sites under $+20\text{ yr}$ climate rainfall stress to guarantee families are never relocated into a nascent hazard zone.

### 3. Multi-Criteria Priority Ranking & Greedy Matching
$$\text{Priority Score} = \text{Hazard Score} \times \text{Vulnerability Score} \times \left(1 + \frac{\text{Verified Reports Count}}{10}\right)$$
- Habitants are greedily assigned to candidate relocation sites by distance, suitability score, and available capacity. If a primary site fills up, allocations spill over to the next closest safe site without overbooking.

---

## 4. Technology Stack & Architecture

- **Frontend:** React 18.3, TypeScript 5.6, Vite 6.0
- **Mapping & GIS Engine:** MapLibre GL JS 6.13, Leaflet 1.9, `@turf/*` spatial analytics
- **State Management:** Zustand 5.0 with persistent storage adapters
- **Visual Design:** Vanilla Tailwind CSS with refined Neumorphism and government-tech color tokens:
  - Deep Navy typography: `#0F291E` / `#0B1F33`
  - Emerald Green safe status: `#059669` / `#047857`
  - Hazard severity: Yellow `#D97706`, Orange `#EA580C`, Red `#DC2626`
- **Data Visualization:** Recharts (Scatter matrices, radar charts, telemetry sparklines)
- **Document Generation:** jsPDF & html2canvas for official relocation orders and audit reports
- **Client Caching & Offline:** IndexedDB (`idb`) and PWA offline queue
- **Testing & Security:** Vitest 5.0 test suite, DOMPurify sanitization, pre-build secret scanning (`scripts/check-secrets.mjs`)

---

## 5. Quick Start & Execution Commands

### Prerequisites
- Node.js version 18.x or 20.x LTS
- npm version 9.x or higher

### Installation & Execution
```bash
# 1. Clone repository & navigate to project directory
cd NIVARAN

# 2. Install dependencies
npm install

# 3. Verify security secrets and run unit tests
npm test

# 4. Start local development server
npm run dev

# 5. Build production bundle with type validation
npm run build
```

---

## 6. Default Demonstration Accounts

| Role | Email / Identifier | Password / Credential | Jurisdiction / Permissions |
|---|---|---|---|
| **State Authority (SDMA)** | `sdma@nivaran.gov` | `Nivaran@123` | Full state administration, relocation approvals, CAP alert broadcasting. |
| **District Administration (DDMA)** | `district@nivaran.gov` | `District@123` | District-level triage, shelter management, resource dispatch. |
| **Field Officer / Inspector** | `field@nivaran.gov` | `Field@123` | Ground truth verification, GPS survey submission, shelter check-ins. |
| **Citizen / Villager** | Mobile `9876543210` | OTP `123456` | Citizen Safety Portal, SOS beacon, shelter finder, incident submission. |

---

## 7. Data Source Health & Connection Status

| Agency / Dataset | Protocol | Integration Status | Live / Simulated Fallback |
|---|---|---|---|
| **India Meteorological Department (IMD)** | REST API | Connected (Open-Meteo & IMD RSS) | Live 24h rainfall & 7-day weather forecast. |
| **Central Water Commission (CWC)** | Vector Polyline | Operational | 6 CWC River hydrology basins mapped with real coordinates. |
| **Geological Survey of India (GSI)** | Vector Lineament | Operational | Sahyadri Western Ghats scarp and Koyna fault lineaments. |
| **ISRO / NRSC Bhuvan** | WMS / Tile Service | Compatible | Satellite basemap toggle and change detection layer. |
| **NDMA SACHET CAP Alerts** | CAP v1.2 / JSON | Operational | 4-tier alert zones with polygon geofencing. |
| **USGS Earthquake Feeds** | GeoJSON API | Connected | Live M2.5+ seismic events around Indian subcontinent. |
| **OpenStreetMap & OSRM** | Vector Tiles / REST | Connected | Free global vector basemaps and road network routing. |
