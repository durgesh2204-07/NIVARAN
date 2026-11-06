import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

function generatePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = margin + 10;
      drawPageDecorations();
    }
  }

  function drawPageDecorations() {
    // Top banner line
    doc.setFillColor(0, 128, 96); // #008060
    doc.rect(margin, 8, contentWidth, 1.2, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 128, 96);
    doc.text('NIVARAN · SMART DISASTER RESPONSE & RELOCATION SYSTEM', margin, 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TECHNICAL STACK & ARCHITECTURE SPECIFICATION', pageWidth - margin, 6, { align: 'right' });

    // Bottom line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Footer text
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CONFIDENTIAL · OFFICIAL SYSTEM ARCHITECTURE · v2.0.0 PRODUCTION', margin, pageHeight - 7.5);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  // ==========================================
  // COVER / BANNER (PAGE 1)
  // ==========================================
  drawPageDecorations();

  // Hero Card
  doc.setFillColor(11, 31, 51); // Dark Navy #0B1F33
  doc.roundedRect(margin, currentY, contentWidth, 38, 3, 3, 'F');

  // Emerald accent strip on left
  doc.setFillColor(0, 128, 96);
  doc.roundedRect(margin, currentY, 4, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('NIVARAN — PLATFORM TECH STACK', margin + 10, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(167, 243, 208); // Light emerald
  doc.text('Smart Disaster Early Warning, Live GIS & Relocation Decision-Support System', margin + 10, currentY + 20);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Complete End-to-End Technology Stack, Architecture Pipeline, Spatial Engines & Libraries', margin + 10, currentY + 26);

  // Metadata pills inside hero
  doc.setFillColor(23, 47, 70);
  doc.roundedRect(margin + 10, currentY + 29.5, 34, 5.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('VERSION 2.0.0 PROD', margin + 12, currentY + 33.5);

  doc.setFillColor(23, 47, 70);
  doc.roundedRect(margin + 47, currentY + 29.5, 42, 5.5, 1.5, 1.5, 'F');
  doc.text('DATE: NOVEMBER 2026', margin + 49, currentY + 33.5);

  doc.setFillColor(0, 128, 96);
  doc.roundedRect(margin + 92, currentY + 29.5, 48, 5.5, 1.5, 1.5, 'F');
  doc.text('NDMA & SDMA COMPLIANT', margin + 94, currentY + 33.5);

  currentY += 44;

  // ==========================================
  // SECTION HELPER
  // ==========================================
  function renderSectionHeader(num, title, iconText = '') {
    checkPageBreak(16);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'F');

    doc.setFillColor(0, 128, 96);
    doc.rect(margin, currentY, 2.5, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 31, 51);
    doc.text(`${num}. ${title}`, margin + 6, currentY + 5.5);

    if (iconText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(iconText, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
    }
    currentY += 11;
  }

  function renderCategoryBox(title, items) {
    const boxHeight = 8 + items.length * 6.5;
    checkPageBreak(boxHeight + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

    // Title bar
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 128, 96);
    doc.text(title.toUpperCase(), margin + 4, currentY + 5);

    let rowY = currentY + 11.5;
    items.forEach((item) => {
      // Bullet dot
      doc.setFillColor(16, 185, 129);
      doc.circle(margin + 5, rowY - 1, 1, 'F');

      // Key
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(item.name, margin + 9, rowY);

      // Version badge if present
      let offset = margin + 9 + doc.getTextWidth(item.name) + 2;
      if (item.version) {
        doc.setFillColor(230, 247, 242);
        doc.roundedRect(offset, rowY - 3.2, doc.getTextWidth(item.version) + 3, 4.2, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 128, 96);
        doc.text(item.version, offset + 1.5, rowY - 0.3);
        offset += doc.getTextWidth(item.version) + 5;
      }

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const descText = '— ' + item.desc;
      doc.text(descText, offset, rowY, { maxWidth: pageWidth - margin - offset - 2 });

      rowY += 6.5;
    });

    currentY += boxHeight + 4;
  }

  // ==========================================
  // SECTION 1: SYSTEM TOPOLOGY & ARCHITECTURE
  // ==========================================
  renderSectionHeader('1', 'HIGH-LEVEL SYSTEM TOPOLOGY & ARCHITECTURE', 'Multi-Tier Decoupled');

  checkPageBreak(24);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 31, 51);
  doc.text('Architecture Paradigm:', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const archDesc =
    'NIVARAN operates as an asynchronous, zero-downtime, spatial-first architecture designed for mission-critical disaster management. ' +
    'The client utilizes an offline-first Progressive Web Application with local IndexedDB queuing (72h expiry). The backend exposes an ' +
    'asynchronous FastAPI REST gateway with JWT Role-Based Access Control (RBAC), driving a dual-persistence layer combining ' +
    'PostgreSQL 14+ / PostGIS 3.0+ for geodetic spatial queries and MongoDB 7.0+ for high-volume document registries and telemetry.';
  doc.text(archDesc, margin + 4, currentY + 10, { maxWidth: contentWidth - 8 });
  currentY += 26;

  // ==========================================
  // SECTION 2: FRONTEND PRESENTATION TIER
  // ==========================================
  renderSectionHeader('2', 'FRONTEND CLIENT & PRESENTATION TIER (SPA / PWA)', 'Web & Field PWA');

  renderCategoryBox('Core Framework & Runtime', [
    { name: 'React', version: 'v18.3.1', desc: 'Component architecture, Strict Mode, Suspense, Concurrent Hooks' },
    { name: 'TypeScript', version: 'v5.6.2', desc: 'Strict mode, comprehensive typing for spatial, hazard & demographic models' },
    { name: 'Vite', version: 'v6.0.5', desc: 'ESM-native build system, fast Hot Module Replacement, optimized chunking' },
    { name: 'React Router DOM', version: 'v6.28.0', desc: 'Nested routing, declarative route guards, dynamic code splitting' },
  ]);

  renderCategoryBox('User Interface, Motion & Theming', [
    { name: 'Tailwind CSS', version: 'v3.4.17', desc: 'Custom disaster tokens, light/dark theme, responsive mobile-to-EOC screens' },
    { name: 'Framer Motion', version: 'v11.15.0', desc: 'GPU-accelerated page transitions, smooth sliding drawers, modal tabs' },
    { name: 'Lucide React', version: 'v0.469.0', desc: 'Crisp vector icon system across dashboards and spatial controls' },
    { name: 'PostCSS / Autoprefixer', version: 'v8.4 / v10.4', desc: 'Cross-browser compatibility and automated prefixing' },
  ]);

  renderCategoryBox('State Management, Offline Sync & Forms', [
    { name: 'Zustand', version: 'v5.0.2', desc: 'Atomic global state store, selective component re-rendering, multi-tab sync' },
    { name: 'TanStack React Query', version: 'v5.62.7', desc: 'Async server state caching, background refetch, stale-time management' },
    { name: 'idb (IndexedDB)', version: 'v8.0.4', desc: 'Offline-first database, 72-hour field mutation queue & auto-reconciliation' },
    { name: 'Zod & React Hook Form', version: 'v3.24 / v7.54', desc: 'Strict runtime schema validation for field incident input forms' },
    { name: 'DOMPurify', version: 'v3.4.16', desc: 'Context-aware XSS sanitization for citizen alerts and dynamic map tooltips' },
  ]);

  // ==========================================
  // SECTION 3: GEOSPATIAL & GIS ENGINE
  // ==========================================
  renderSectionHeader('3', 'GEOSPATIAL & LIVE GIS MAPPING STACK', '2D / 3D Spatial Engines');

  renderCategoryBox('Map Rendering Engines & Multi-Viewports', [
    { name: 'MapLibre GL JS', version: 'v6.13.0', desc: 'High-performance WebGL 2D/3D GPU vector & raster map rendering engine' },
    { name: 'Leaflet & React-Leaflet', version: 'v1.9.4 / v4.2.1', desc: 'Situational secondary viewports, mini-maps & fast raster overlays' },
    { name: 'AWS Terrarium DEM', version: '30m Resolution', desc: '3D terrain elevation meshes, slope gradient analysis & flood simulator' },
  ]);

  renderCategoryBox('Spatial Computations, Geofencing & Vectors', [
    { name: 'Turf.js Suite', version: 'v7.4.0', desc: '@turf/buffer, area, distance, centroid, along, nearest-point, polygon checks' },
    { name: 'Supercluster', version: 'v9.1.0', desc: 'High-density spatial clustering for 10,000+ villages, shelters & resources' },
    { name: 'Mapbox GL Draw & Geoman', version: 'v1.5.2 / v2.17', desc: 'Interactive polygon digitization, boundary editing & hazard containment' },
    { name: 'shpjs', version: 'v6.2.0', desc: 'Client-side ESRI Shapefile (.shp/.dbf/.prj) parsing directly into GeoJSON' },
  ]);

  // ==========================================
  // SECTION 4: BACKEND & API GATEWAY
  // ==========================================
  renderSectionHeader('4', 'BACKEND API SERVICES & DATA PIPELINE', 'Python Async Engine');

  renderCategoryBox('Application Server & Framework', [
    { name: 'Python', version: 'v3.10+ / 3.14', desc: 'High-performance asynchronous runtime for mathematical risk modeling' },
    { name: 'FastAPI', version: 'v0.115.0+', desc: 'Async RESTful microservice framework with OpenAPI/Swagger interactive docs' },
    { name: 'Uvicorn', version: 'v0.30.0+', desc: 'Lightning-fast ASGI web server with worker management and keep-alive' },
    { name: 'Pydantic', version: 'v2.8.0+', desc: 'Strict data serialization, request/response models & contract validation' },
    { name: 'HTTPX', version: 'v0.27.0+', desc: 'Non-blocking async HTTP client for external weather and seismic streams' },
  ]);

  renderCategoryBox('Security, Rate Limiting & Authentication', [
    { name: 'JWT & Python-JOSE', version: 'HS256', desc: 'Stateless access tokens, 120-minute expiry, refresh token rotation' },
    { name: 'Passlib & Bcrypt', version: 'v4.2.0', desc: 'Salted cryptographic password hashing with 12 computational rounds' },
    { name: 'Custom Rate Limiter', version: 'Token Bucket', desc: 'Per-IP leaky-bucket rate limiting preventing DoS attacks on telemetry APIs' },
    { name: 'RBAC Access Control', version: '10 Roles', desc: 'Granular permissions: Admin, SDMA, District, Field, Responder, Citizen' },
  ]);

  // ==========================================
  // SECTION 5: DATABASE & PERSISTENCE TIER
  // ==========================================
  renderSectionHeader('5', 'DATABASE & PERSISTENCE INFRASTRUCTURE', 'Dual-Persistence');

  renderCategoryBox('PostgreSQL + PostGIS (Spatial & Administrative Core)', [
    { name: 'PostgreSQL', version: 'v14+', desc: 'ACID relational database engine for administrative records and users' },
    { name: 'PostGIS Extension', version: 'v3.0+', desc: 'Geospatial indexing (GIST R-Tree), EPSG:4326 MultiPolygon geometry' },
    { name: 'Spatial SQL Functions', version: 'ST_Suite', desc: 'ST_Intersects, ST_Buffer, ST_Area, ST_Within, ST_DWithin geoprocessing' },
    { name: '5-Level Admin Hierarchy', version: 'Standard', desc: 'Country (India) -> States -> Districts -> Talukas -> Villages' },
  ]);

  renderCategoryBox('MongoDB & Client-Side Caching', [
    { name: 'MongoDB', version: 'v7.0+', desc: '18 collections: risk zones, telemetry logs, IDRN resources, scenario runs' },
    { name: 'PyMongo & 2dsphere', version: 'v4.9.0', desc: 'Geospatial 2dsphere proximity indexes and GeoJSON polygon serialization' },
    { name: 'MemoryCollection Fallback', version: 'Built-in', desc: 'Resilient in-memory fallback guaranteeing 100% API uptime if DB fluctuates' },
    { name: 'IndexedDB (Browser)', version: 'HTML5', desc: 'Local client storage for offline mutations, draft reports & basemaps' },
  ]);

  // ==========================================
  // SECTION 6: ANALYTICS, EXPORT & PROTOCOLS
  // ==========================================
  renderSectionHeader('6', 'ANALYTICS, REPORTING & PROTOCOL STANDARDS', 'Open Interoperability');

  renderCategoryBox('Visualization, Documents & Exporting', [
    { name: 'Recharts', version: 'v2.15.0', desc: 'Interactive charts: hazard histograms, radar vulnerability & bar metrics' },
    { name: 'jsPDF & html2canvas', version: 'v2.5.2 / v1.4.1', desc: 'Client-side generation of signed Government Orders & SitRep PDF files' },
    { name: 'PapaParse', version: 'v5.4.1', desc: 'Streaming parsing and export of IDRN inventory and census records' },
  ]);

  renderCategoryBox('External Integrations & Protocol Standards', [
    { name: 'CAP v1.2 Protocol', version: 'ITU-T X.1303', desc: 'Common Alerting Protocol for emergency public sirens and cell broadcasts' },
    { name: 'IMD / Open-Meteo', version: '15-min Telemetry', desc: 'Real-time rainfall radar feeds and 7-day predictive precipitation curves' },
    { name: 'USGS & NCS Seismology', version: 'Live GeoJSON', desc: 'Earthquake epicenter feeds, magnitude thresholds & shake map contours' },
    { name: 'OSRM / OpenStreetMap', version: 'Routing Engine', desc: 'Live multi-modal evacuation corridor routing to nearest safe shelters' },
  ]);

  // ==========================================
  // SECTION 7: TESTING & QUALITY ASSURANCE
  // ==========================================
  renderSectionHeader('7', 'TESTING, QUALITY ASSURANCE & CI/CD', '100% Pass Rate');

  renderCategoryBox('Automated Testing & Security Verification', [
    { name: 'Vitest Test Runner', version: 'v5.0.3', desc: '192 unit and integration tests covering scoring, auth & geospatial math' },
    { name: 'PyTest Suite', version: 'v8.0.0+', desc: 'Backend automated test suite verifying FastAPI routes & PostGIS schemas' },
    { name: 'Secret Guard Scanner', version: 'check-secrets', desc: 'Pre-build zero-leakage scanner checking 98 source files for credentials' },
    { name: 'Web Vitals Telemetry', version: 'v6.2.3', desc: 'Continuous production tracking of LCP, FID, and CLS performance' },
  ]);

  // Save PDF to multiple locations:
  // 1. public/ folder for direct web download
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPdfPath = path.join(publicDir, 'NIVARAN_Tech_Stack_Specification.pdf');

  // 2. workspace root
  const rootPdfPath = path.resolve('NIVARAN_Tech_Stack_Specification.pdf');

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(publicPdfPath, pdfBuffer);
  fs.writeFileSync(rootPdfPath, pdfBuffer);

  console.log(`Generated PDF at ${publicPdfPath} (${pdfBuffer.length} bytes)`);
  console.log(`Generated PDF at ${rootPdfPath} (${pdfBuffer.length} bytes)`);
}

generatePdf();

