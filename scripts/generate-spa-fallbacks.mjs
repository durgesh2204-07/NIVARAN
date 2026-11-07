/**
 * NIVARAN GIS 2.0 - Static SPA Route Fallback Generator
 *
 * Automatically generates static HTML entry points and a 404.html fallback in dist/
 * for all client-side routes, ensuring 100% reliable direct URL navigation and page refreshes
 * on Vercel, Netlify, GitHub Pages, Apache, and standard static web servers without 404 errors.
 */

import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

const SPA_ROUTES = [
  'map',
  'gis',
  'dashboard',
  'login',
  'disaster-history',
  'india-disaster-history',
  'digital-twin',
  'hazard-map',
  'climate-intelligence',
  'climate-vulnerability',
  'climate-impact-prediction',
  'climate-anomaly-detection',
  'vulnerability',
  'priority-ranking',
  'relocation-sites',
  'site-suitability',
  'planning',
  'simulator',
  'scenarios',
  'community-reports',
  'incidents',
  'alerts',
  'early-warning',
  'sos',
  'evacuation',
  'resources',
  'volunteers',
  'national-portals',
  'relocation-tracker',
  'impact',
  'analytics',
  'data-sources',
  'citizen-portal',
  'citizen',
  'public',
  'settings',
];

if (!fs.existsSync(INDEX_PATH)) {
  console.warn('[SPA Fallback Generator] dist/index.html not found, skipping generation.');
  process.exit(0);
}

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');

// 1. Generate 404.html fallback
const fallback404 = path.join(DIST_DIR, '404.html');
fs.writeFileSync(fallback404, indexHtml, 'utf8');

// 2. Generate subdirectories and HTML files for each route
let createdCount = 0;
for (const route of SPA_ROUTES) {
  const routeDir = path.join(DIST_DIR, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml, 'utf8');
  fs.writeFileSync(path.join(DIST_DIR, `${route}.html`), indexHtml, 'utf8');
  createdCount++;
}

console.log(`[SPA Fallback Generator] Successfully generated 404.html and ${createdCount} static route entry points in dist/`);
