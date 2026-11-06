import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Activity,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  FileSpreadsheet,
  FileText,
  Globe,
  HelpCircle,
  History,
  Info,
  Layers,
  Map as MapIcon,
  MapPin,
  Minimize2,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  ALL_36_STATES_AND_UTS,
  DISASTER_CATEGORIES,
  MASTER_NATIONAL_DISASTER_INCIDENTS,
  calculateDisasterHistorySummary,
  filterDisasterRecords,
  DisasterFilters,
} from '../data/indiaDisasterHistoryData';
import {
  DisasterCategory,
  DisasterSeverity,
  NationalDisasterIncident,
} from '../types';

export const IndiaDisasterHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------
  // 1. FILTER & SEARCH STATE (Default Rolling 30 Days: Oct 7 – Nov 5, 2026)
  // -------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<'all' | 'natural' | 'human_induced'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('2026-10-07');
  const [endDate, setEndDate] = useState('2026-11-05');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'severity' | 'casualties'>('date_desc');
  const [viewMode, setViewMode] = useState<'split' | 'map_only' | 'timeline_only'>('split');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Incident for Slide-in Details Panel
  const [activeIncident, setActiveIncident] = useState<NationalDisasterIncident | null>(null);
  const [isDrawerMinimized, setIsDrawerMinimized] = useState<boolean>(false);

  // Basemap & GIS Layers
  const [basemapMode, setBasemapMode] = useState<'street' | 'satellite' | 'topo' | 'dark'>('street');
  const [showGeospatialZones, setShowGeospatialZones] = useState<boolean>(true);

  // Active fly-to beacon animation label
  const [flyToNotice, setFlyToNotice] = useState<string | null>(null);

  // MapLibre GL Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const beaconMarkerRef = useRef<maplibregl.Marker | null>(null);

  // -------------------------------------------------------------------
  // 2. QUERY PARAMS SYNC
  // -------------------------------------------------------------------
  useEffect(() => {
    const incId = searchParams.get('incidentId');
    if (incId) {
      const match = MASTER_NATIONAL_DISASTER_INCIDENTS.find((i) => i.id === incId);
      if (match) {
        setActiveIncident(match);
      }
    }
  }, [searchParams]);

  // -------------------------------------------------------------------
  // 3. FILTERED INCIDENTS & DYNAMIC CALCULATIONS
  // -------------------------------------------------------------------
  const filters: DisasterFilters = useMemo(
    () => ({
      searchTerm,
      state: selectedState,
      category: selectedCategory,
      severity: selectedSeverity,
      status: selectedStatus,
      startDate,
      endDate,
      sortBy,
    }),
    [searchTerm, selectedState, selectedCategory, selectedSeverity, selectedStatus, startDate, endDate, sortBy]
  );

  const filteredIncidents = useMemo(() => {
    let list = filterDisasterRecords(MASTER_NATIONAL_DISASTER_INCIDENTS, filters);
    if (selectedCategoryGroup !== 'all') {
      list = list.filter((i) => i.categoryGroup === selectedCategoryGroup);
    }
    return list;
  }, [filters, selectedCategoryGroup]);

  // Dynamic Dashboard Metrics calculated strictly from database records
  const summaryMetrics = useMemo(() => {
    return calculateDisasterHistorySummary(filteredIncidents);
  }, [filteredIncidents]);

  // Pagination Slicing
  const paginatedIncidents = useMemo(() => {
    if (pageSize >= 999) return filteredIncidents;
    const start = (currentPage - 1) * pageSize;
    return filteredIncidents.slice(start, start + pageSize);
  }, [filteredIncidents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredIncidents.length / (pageSize >= 999 ? filteredIncidents.length || 1 : pageSize));

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedState, selectedCategory, selectedCategoryGroup, selectedSeverity, selectedStatus, startDate, endDate, sortBy]);

  // -------------------------------------------------------------------
  // 4. MAPLIBRE GL INITIALIZATION WITH DATABASE GEOSPATIAL ZONES
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm_street: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
          },
          esri_sat: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_roads_overlay: {
            type: 'raster',
            tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_labels_overlay: {
            type: 'raster',
            tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
          },
          open_topo: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 19,
          },
          carto_dark: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'basemap-street', type: 'raster', source: 'osm_street', layout: { visibility: 'visible' } },
          { id: 'basemap-satellite', type: 'raster', source: 'esri_sat', layout: { visibility: 'none' } },
          { id: 'basemap-satellite-roads', type: 'raster', source: 'esri_roads_overlay', layout: { visibility: 'none' } },
          { id: 'basemap-satellite-labels', type: 'raster', source: 'esri_labels_overlay', layout: { visibility: 'none' } },
          { id: 'basemap-topo', type: 'raster', source: 'open_topo', layout: { visibility: 'none' } },
          { id: 'basemap-dark', type: 'raster', source: 'carto_dark', layout: { visibility: 'none' } },
        ],
      },
      center: [78.9629, 22.5937], // Centered on India
      zoom: 4.6,
      minZoom: 3.5,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      // 1. Add database-backed Geospatial Risk Zones GeoJSON Source
      map.addSource('db-geospatial-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // 2. Geospatial Zones Fill Layer (Color-coded by 0-100 risk tier from MongoDB)
      map.addLayer({
        id: 'db-geospatial-zones-fill',
        type: 'fill',
        source: 'db-geospatial-zones',
        paint: {
          'fill-color': [
            'coalesce',
            ['get', 'color_hex'],
            [
              'match',
              ['get', 'category_code'],
              'RED', '#DC2626',
              'YELLOW', '#EAB308',
              'ORANGE', '#F97316',
              'LIGHT_GREEN', '#84CC16',
              'GREEN', '#16A34A',
              '#DC2626'
            ]
          ],
          'fill-opacity': 0.38,
        },
      });

      // 3. Geospatial Zones Crisp Boundary Outline Layer
      map.addLayer({
        id: 'db-geospatial-zones-outline',
        type: 'line',
        source: 'db-geospatial-zones',
        paint: {
          'line-color': [
            'coalesce',
            ['get', 'color_hex'],
            [
              'match',
              ['get', 'category_code'],
              'RED', '#DC2626',
              'YELLOW', '#EAB308',
              'ORANGE', '#F97316',
              'LIGHT_GREEN', '#84CC16',
              'GREEN', '#16A34A',
              '#DC2626'
            ]
          ],
          'line-width': 2.5,
        },
      });

      // 4. Click popup on database geospatial zones
      map.on('click', 'db-geospatial-zones-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as any;
        const color = props.color_hex || '#DC2626';

        new maplibregl.Popup({ offset: 12, maxWidth: '280px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: inherit; font-size: 11.5px; padding: 4px; line-height: 1.4;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #0F172A;">${props.zone_id || 'GIS-ZONE'}</span>
                <span style="background: ${color}; color: #fff; font-weight: 700; font-size: 10px; padding: 1px 6px; border-radius: 4px;">
                  Score: ${props.risk_score || 85}/100
                </span>
              </div>
              <div style="font-weight: 700; font-size: 12.5px; color: #0F172A; margin-bottom: 2px;">${props.name || 'Geospatial Hazard Zone'}</div>
              <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">📍 ${props.district || 'Western Ghats'}, Maharashtra</div>
              <div style="background: #F8FAFC; border-radius: 6px; padding: 6px; font-size: 10.5px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div>Area: <b>${props.affected_area_sqkm || '18.5'} sq km</b></div>
                <div>Pop: <b>${(props.exposed_population || 2400).toLocaleString()}</b></div>
                <div>Hazard: <b>${props.hazard_score || 88}/100</b></div>
                <div>Category: <b style="color: ${color};">${props.risk_category || 'High Risk'}</b></div>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'db-geospatial-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'db-geospatial-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Load geospatial zones from FastAPI backend / MongoDB
      fetch('/api/gis/risk-zones')
        .then((res) => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          return ct.includes('application/json') ? res.json() : null;
        })
        .then((data) => {
          if (!data?.features) return;
          const src = map.getSource('db-geospatial-zones') as maplibregl.GeoJSONSource | undefined;
          if (src) {
            src.setData(data);
          }
        })
        .catch(() => {});
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Layer Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    map.setLayoutProperty('basemap-street', 'visibility', basemapMode === 'street' ? 'visible' : 'none');
    map.setLayoutProperty('basemap-satellite', 'visibility', basemapMode === 'satellite' ? 'visible' : 'none');
    map.setLayoutProperty('basemap-satellite-roads', 'visibility', basemapMode === 'satellite' ? 'visible' : 'none');
    map.setLayoutProperty('basemap-satellite-labels', 'visibility', basemapMode === 'satellite' ? 'visible' : 'none');
    map.setLayoutProperty('basemap-topo', 'visibility', basemapMode === 'topo' ? 'visible' : 'none');
    map.setLayoutProperty('basemap-dark', 'visibility', basemapMode === 'dark' ? 'visible' : 'none');
  }, [basemapMode]);

  // Update Database Geospatial Zones Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('db-geospatial-zones-fill')) {
      map.setLayoutProperty('db-geospatial-zones-fill', 'visibility', showGeospatialZones ? 'visible' : 'none');
    }
    if (map.getLayer('db-geospatial-zones-outline')) {
      map.setLayoutProperty('db-geospatial-zones-outline', 'visibility', showGeospatialZones ? 'visible' : 'none');
    }
  }, [showGeospatialZones]);

  // Helper for Severity Color
  const getSeverityColor = (sev: DisasterSeverity) => {
    switch (sev) {
      case 'Critical':
        return '#DC2626';
      case 'Severe':
        return '#EA580C';
      case 'Moderate':
        return '#CA8A04';
      case 'Minor':
        return '#0284C7';
      default:
        return '#64748B';
    }
  };

  // Helper for Category Icon
  const getCategoryIconSvg = (cat: DisasterCategory) => {
    switch (cat) {
      case 'flood':
      case 'flash_flood':
      case 'urban_flood':
      case 'heavy_rainfall':
      case 'cloudburst':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c.6 0 1.2-.2 1.7-.6 1-.7 2.4-.7 3.4 0 1 .7 2.4.7 3.4 0 1-.7 2.4-.7 3.4 0 1 .7 2.4.7 3.4 0 .5.4 1.1.6 1.7.6"/><path d="M2 17c.6 0 1.2-.2 1.7-.6 1-.7 2.4-.7 3.4 0 1 .7 2.4.7 3.4 0 1-.7 2.4-.7 3.4 0 1 .7 2.4.7 3.4 0 .5.4 1.1.6 1.7.6"/></svg>`;
      case 'landslide':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
      case 'cyclone':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`;
      case 'earthquake':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
      case 'industrial_accident':
      case 'chemical_gas_leak':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`;
      case 'major_fire':
      case 'forest_fire':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      case 'building_collapse':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/></svg>`;
      case 'avalanche':
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }
  };

  // -------------------------------------------------------------------
  // 5. UPDATE MAP MARKERS ON INCIDENTS CHANGE
  // -------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geoIncidents = filteredIncidents.filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number');

    geoIncidents.forEach((inc) => {
      const color = getSeverityColor(inc.severity);
      const isSelected = activeIncident?.id === inc.id;

      const el = document.createElement('div');
      el.className = 'disaster-marker group cursor-pointer transition-transform duration-200 hover:scale-125';
      el.id = `marker-${inc.id}`;
      el.style.width = isSelected ? '40px' : '32px';
      el.style.height = isSelected ? '40px' : '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#0F172A';
      el.style.border = `3px solid ${color}`;
      el.style.boxShadow = isSelected
        ? `0 0 0 6px ${color}55, 0 8px 20px rgba(0,0,0,0.6)`
        : `0 4px 10px rgba(0,0,0,0.4)`;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#FFFFFF';
      el.innerHTML = getCategoryIconSvg(inc.category);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #0F172A; max-width: 260px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-weight: 700; color: #0F172A; font-size: 11px;">${inc.id}</span>
            <span style="background: ${color}20; color: ${color}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid ${color}40;">
              ${inc.severity}
            </span>
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0F172A; margin-bottom: 4px;">${inc.title}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">📍 ${inc.locality ? `${inc.locality}, ` : ''}${inc.district}, ${inc.state}</div>
          <div style="background: #F1F5F9; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10.5px;">
            <div>Deaths: <b>${inc.humanImpact.deathsConfirmed ?? 'Not Reported'}</b></div>
            <div>Injured: <b>${inc.humanImpact.injuredConfirmed ?? 'Not Reported'}</b></div>
            <div>Status: <span style="font-weight: 600;">${inc.status}</span></div>
            <div>Date: <b>${inc.incidentDate}</b></div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-inspect-${inc.id}" style="flex: 1; background: #0B8F80; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Full Details
            </button>
            <button id="btn-locate-${inc.id}" style="flex: 1; background: #0F172A; color: white; border: none; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              📍 Zoom In
            </button>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 16, closeButton: true, maxWidth: '280px' }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inc.lng as number, inc.lat as number])
        .setPopup(popup)
        .addTo(map);

      (marker as any).incidentId = inc.id;

      el.addEventListener('click', () => {
        handleSelectIncident(inc);
      });

      popup.on('open', () => {
        const inspectBtn = document.getElementById(`btn-inspect-${inc.id}`);
        if (inspectBtn) {
          inspectBtn.addEventListener('click', () => {
            handleSelectIncident(inc);
            popup.remove();
          });
        }
        const locateBtn = document.getElementById(`btn-locate-${inc.id}`);
        if (locateBtn) {
          locateBtn.addEventListener('click', () => {
            handleFlyToLocation(inc);
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [filteredIncidents, activeIncident]);

  // Handle selecting an incident
  const handleSelectIncident = (inc: NationalDisasterIncident) => {
    setActiveIncident(inc);
    setIsDrawerMinimized(false);
    setSearchParams({ incidentId: inc.id });

    if (mapRef.current && typeof inc.lat === 'number' && typeof inc.lng === 'number') {
      mapRef.current.flyTo({
        center: [inc.lng, inc.lat],
        zoom: 10.5,
        essential: true,
        duration: 1400,
      });
    }
  };

  // -------------------------------------------------------------------
  // 6. DIRECT "WHERE IT HAPPENED -> SHOW ON MAP" WORKFLOW
  // -------------------------------------------------------------------
  const handleFlyToLocation = (inc: NationalDisasterIncident, specificLocality?: string) => {
    // 1. If currently in timeline-only mode, switch to split view so map is visible
    if (viewMode === 'timeline_only') {
      setViewMode('split');
      setTimeout(() => {
        mapRef.current?.resize();
      }, 50);
    }

    // 2. Set active incident and minimize drawer so the map is 100% visible
    setActiveIncident(inc);
    setIsDrawerMinimized(true);
    setSearchParams({ incidentId: inc.id });

    // 3. Scroll smoothly to the map container
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 4. If verified coordinates exist, fly to exact point, trigger pulsing beacon & open callout popup
    if (mapRef.current && typeof inc.lat === 'number' && typeof inc.lng === 'number') {
      mapRef.current.flyTo({
        center: [inc.lng, inc.lat],
        zoom: 11.5,
        essential: true,
        duration: 1200,
      });

      // Automatically open the marker's interactive popup on the map
      markersRef.current.forEach((m) => {
        const p = m.getPopup();
        if ((m as any).incidentId === inc.id) {
          if (p && !p.isOpen()) {
            m.togglePopup();
          }
        } else {
          if (p && p.isOpen()) {
            p.remove();
          }
        }
      });

      // Place / update animated target beacon marker
      if (beaconMarkerRef.current) {
        beaconMarkerRef.current.remove();
      }

      const beaconEl = document.createElement('div');
      beaconEl.className = 'relative flex items-center justify-center pointer-events-none';
      beaconEl.innerHTML = `
        <span class="animate-ping absolute inline-flex h-14 w-14 rounded-full bg-[#0B8F80] opacity-80"></span>
        <span class="relative inline-flex rounded-full h-6 w-6 bg-[#0B8F80] border-2 border-white shadow-xl ring-4 ring-[#0B8F80]/30"></span>
      `;

      beaconMarkerRef.current = new maplibregl.Marker({ element: beaconEl })
        .setLngLat([inc.lng, inc.lat])
        .addTo(mapRef.current);

      // Remove beacon after 4.5 seconds
      setTimeout(() => {
        if (beaconMarkerRef.current) {
          beaconMarkerRef.current.remove();
          beaconMarkerRef.current = null;
        }
      }, 4500);

      const locName = specificLocality || inc.locality || inc.district;
      setFlyToNotice(`📍 Showing on Map: ${locName} (${inc.district}, ${inc.state}) · ${inc.lat.toFixed(4)}°N, ${inc.lng.toFixed(4)}°E`);
      setTimeout(() => setFlyToNotice(null), 6000);
    } else {
      setFlyToNotice(`⚠️ GPS Coordinates unavailable for ${inc.locality || inc.district}. Recorded under ${inc.district}, ${inc.state}.`);
      setTimeout(() => setFlyToNotice(null), 5000);
    }
  };

  // Bidirectional View on Live GIS Navigation
  const handleViewOnLiveGis = (inc: NationalDisasterIncident) => {
    const lat = inc.lat ?? 18.5204;
    const lng = inc.lng ?? 73.8567;
    navigate(`/map?incidentId=${inc.id}&lat=${lat}&lng=${lng}&title=${encodeURIComponent(inc.title)}&severity=${inc.severity}&from=disaster-history`);
  };

  // Reset India bounds
  const handleResetMapBounds = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [78.9629, 22.5937],
        zoom: 4.6,
        pitch: 0,
        bearing: 0,
        duration: 1400,
      });
    }
  };

  // Export sitrep as CSV
  const handleExportCsv = () => {
    const headers = [
      'Incident ID',
      'Title',
      'Category',
      'State',
      'District',
      'Locality',
      'Date',
      'Time',
      'Severity',
      'Status',
      'Confirmed Deaths',
      'Provisional Deaths',
      'Confirmed Injured',
      'Missing',
      'Rescued',
      'Evacuated',
      'Latitude',
      'Longitude',
      'Data Source',
    ];

    const rows = filteredIncidents.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.categoryLabel,
      i.state,
      i.district,
      `"${(i.locality || '').replace(/"/g, '""')}"`,
      i.incidentDate,
      i.incidentTime || '',
      i.severity,
      i.status,
      i.humanImpact.deathsConfirmed ?? 'Not Reported',
      i.humanImpact.deathsProvisional ?? 'Not Reported',
      i.humanImpact.injuredConfirmed ?? 'Not Reported',
      i.humanImpact.missing ?? 'Not Reported',
      i.humanImpact.rescued ?? 'Not Reported',
      i.humanImpact.evacuated ?? 'Not Reported',
      i.lat ?? 'Not Available',
      i.lng ?? 'Not Available',
      `"${i.dataSource.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NIVARAN_National_Disaster_History_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* -----------------------------------------------------------------
          TOP HEADER: INDIA DISASTER HISTORY
      ----------------------------------------------------------------- */}
      <header className="neu-raised border-b border-[var(--border)] px-4 sm:px-6 py-3.5 sticky top-0 z-30 bg-[var(--bg-canvas)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B8F80] to-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Globe className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded">
                  NIVARAN National Portal
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  All 36 States & UTs
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
                India Disaster History
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Nationwide Disaster Events – Last 30 Days (Rolling: Oct 7, 2026 – Nov 5, 2026)
              </p>
            </div>
          </div>

          {/* Quick Date Presets & Export Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-[var(--bg-sunken)] p-1 rounded-lg border border-[var(--border)]">
              <Calendar className="w-3.5 h-3.5 text-[#0B8F80] ml-1" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[var(--text-primary)] text-xs font-semibold focus:outline-none px-1"
                title="Start Date"
              />
              <span className="text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[var(--text-primary)] text-xs font-semibold focus:outline-none px-1"
                title="End Date"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="neu-btn px-3 py-1.5 font-semibold flex items-center gap-1.5"
              title="Export filtered records as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0B8F80]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="neu-btn px-3 py-1.5 font-semibold flex items-center gap-1.5"
              title="Print National Sitrep Dossier"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLY-TO LOCATION ALERT BANNER */}
      {flyToNotice && (
        <div className="bg-[#0B8F80] text-white px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-[68px] z-20 shadow-md animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              {flyToNotice}
            </span>
            <button
              type="button"
              onClick={() => setFlyToNotice(null)}
              className="text-white hover:opacity-80 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          SECTION 3: CLEAN 30-DAY DISASTER TELEMETRY DASHBOARD (9 KPI Cards)
      ----------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 py-3.5 bg-[var(--bg-canvas)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] uppercase font-extrabold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0B8F80]" />
              National 30-Day Disaster Telemetry Dashboard
            </h2>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Live Aggregate: {summaryMetrics.totalIncidents} Recorded Events
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {/* 1. Total Incidents */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Total Events</span>
              <div className="text-base font-black text-[var(--text-primary)] mt-0.5">{summaryMetrics.totalIncidents}</div>
              <span className="text-[9.5px] text-[#0B8F80] font-semibold">Verified Registry</span>
            </div>

            {/* 2. Affected States / UTs */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">States & UTs</span>
              <div className="text-base font-black text-[#0284C7] mt-0.5">
                {summaryMetrics.affectedStatesCount} <span className="text-xs font-normal text-[var(--text-muted)]">/ 36</span>
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">Nationwide</span>
            </div>

            {/* 3. Total Deaths */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)] bg-[#DC2626]/5">
              <span className="text-[10px] text-[#DC2626] uppercase font-bold block">Deaths</span>
              <div className="text-base font-black text-[#DC2626] mt-0.5">
                {summaryMetrics.totalDeathsCombined > 0 ? summaryMetrics.totalDeathsCombined : '0'}
              </div>
              <span className="text-[9px] text-[var(--text-secondary)] font-medium block truncate">
                Conf: {summaryMetrics.deathsConfirmed} · Prov: {summaryMetrics.deathsProvisional}
              </span>
            </div>

            {/* 4. Injured */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Injured</span>
              <div className="text-base font-black text-[#EA580C] mt-0.5">
                {summaryMetrics.totalInjuredConfirmed > 0 ? summaryMetrics.totalInjuredConfirmed : '0'}
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">Medical Aid</span>
            </div>

            {/* 5. Missing */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Missing</span>
              <div className="text-base font-black text-[#9333EA] mt-0.5">
                {summaryMetrics.totalMissing > 0 ? summaryMetrics.totalMissing : '0'}
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">Search Active</span>
            </div>

            {/* 6. Affected Districts */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Districts Hit</span>
              <div className="text-base font-black text-[var(--text-primary)] mt-0.5">
                {summaryMetrics.affectedDistrictsCount}
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">Districts</span>
            </div>

            {/* 7. Rescued */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Rescued</span>
              <div className="text-base font-black text-[#0B8F80] mt-0.5">
                {summaryMetrics.totalRescued > 0 ? summaryMetrics.totalRescued.toLocaleString() : 'Not Reported'}
              </div>
              <span className="text-[9.5px] text-[#0B8F80]">NDRF / SDRF</span>
            </div>

            {/* 8. Evacuated */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Evacuated</span>
              <div className="text-base font-black text-[#2563EB] mt-0.5">
                {summaryMetrics.totalEvacuated > 0 ? summaryMetrics.totalEvacuated.toLocaleString() : 'Not Reported'}
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">In Shelters</span>
            </div>

            {/* 9. Active vs Resolved */}
            <div className="neu-sunken p-2.5 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Active / Res</span>
              <div className="text-xs font-black text-[var(--text-primary)] mt-1 flex items-center gap-1">
                <span className="text-[#EA580C]">{summaryMetrics.totalActiveOrUnderway} Act</span>
                <span className="text-[var(--text-muted)]">/</span>
                <span className="text-[#0B8F80]">{summaryMetrics.resolvedCount} Res</span>
              </div>
              <span className="text-[9.5px] text-[var(--text-muted)]">SITREP</span>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------------------------------
          SECTION 2 & 4: MULTI-CRITERIA FILTERS BAR
      ----------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 py-2.5 bg-[var(--bg-canvas)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto space-y-2">
          {/* Row 1: Search + State Selector + Category Group Selector + View Modes */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event, state, district, or locality..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0B8F80]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* State / UT Dropdown (ALL 36 STATES & UTS) */}
            <div className="w-full md:w-52">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-[var(--bg-sunken)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[#0B8F80]"
              >
                <option value="all">🇮🇳 All 36 States & UTs</option>
                {ALL_36_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Natural vs Human-Induced Filter */}
            <div className="flex items-center gap-1 bg-[var(--bg-sunken)] p-0.5 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSelectedCategoryGroup('all')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedCategoryGroup === 'all'
                    ? 'bg-[#0B8F80] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryGroup('natural')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedCategoryGroup === 'natural'
                    ? 'bg-[#0284C7] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Natural (17)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategoryGroup('human_induced')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedCategoryGroup === 'human_induced'
                    ? 'bg-[#E11D48] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Human (7)
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-sunken)] p-0.5 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  viewMode === 'split' ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map_only')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  viewMode === 'map_only' ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline_only')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  viewMode === 'timeline_only' ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Row 2: Category Dropdown + Severity + Status + Sort */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1 px-2 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[#0B8F80]"
            >
              <option value="all">All Disaster Categories (24)</option>
              {DISASTER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.group === 'natural' ? 'Natural' : 'Human'})
                </option>
              ))}
            </select>

            {/* Severity */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="py-1 px-2 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[#0B8F80]"
            >
              <option value="all">All Severities</option>
              <option value="Critical">🔴 Critical</option>
              <option value="Severe">🟠 Severe</option>
              <option value="Moderate">🟡 Moderate</option>
              <option value="Minor">🔵 Minor</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[#0B8F80]"
            >
              <option value="all">All Operational Statuses</option>
              <option value="Active">Active</option>
              <option value="Rescue in Progress">Rescue in Progress</option>
              <option value="Contained">Contained</option>
              <option value="Relief Operations">Relief Operations</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[#0B8F80]"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="severity">Highest Severity</option>
                <option value="casualties">Highest Casualties</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------------------------------
          MAIN CONTENT AREA: MAP & EVENT TIMELINE
      ----------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* INTERACTIVE INDIA DISASTER MAP CONTAINER */}
        <div
          className={`${
            viewMode === 'timeline_only' ? 'hidden' : viewMode === 'map_only' ? 'lg:col-span-12' : 'lg:col-span-7'
          } neu-raised rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col h-[580px] lg:h-[680px] relative`}
        >
            {/* Map Top Bar */}
            <div className="px-4 py-2 bg-[var(--bg-canvas)] border-b border-[var(--border)] flex items-center justify-between z-10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0B8F80]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Interactive National Map
                </span>
                <span className="text-[10px] bg-[#0B8F80]/10 text-[#0B8F80] font-bold px-2 py-0.5 rounded-full">
                  {filteredIncidents.filter((i) => i.coordinatesVerified).length} Georeferenced Pins
                </span>
              </div>

              {/* Controls: Geospatial Zones Toggle + Basemap Switcher */}
              <div className="flex items-center gap-2">
                {/* Official Geospatial Zones Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGeospatialZones(!showGeospatialZones)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    showGeospatialZones
                      ? 'bg-[#0B8F80] text-white border-[#0B8F80]'
                      : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border)]'
                  }`}
                  title="Toggle Official Geospatial Risk Zones"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>GIS Zones: {showGeospatialZones ? 'ON' : 'OFF'}</span>
                </button>

                {/* Basemap Switcher Dock */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-sunken)] p-0.5 rounded-lg border border-[var(--border)] text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setBasemapMode('street')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      basemapMode === 'street' ? 'bg-[#0B8F80] text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Street
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapMode('satellite')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      basemapMode === 'satellite' ? 'bg-[#0B8F80] text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapMode('topo')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      basemapMode === 'topo' ? 'bg-[#0B8F80] text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Topo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapMode('dark')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      basemapMode === 'dark' ? 'bg-[#0B8F80] text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div ref={mapContainerRef} className="flex-1 w-full h-full relative" />

            {/* Map Floating Tools */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResetMapBounds}
                className="neu-btn px-3 py-1.5 text-xs font-bold bg-[var(--bg-raised)] text-[var(--text-primary)] rounded-lg shadow-lg flex items-center gap-1.5"
                title="Reset zoom to India overview"
              >
                <Compass className="w-3.5 h-3.5 text-[#0B8F80]" />
                <span>India View</span>
              </button>
            </div>

            {/* Map Severity Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-[var(--bg-canvas)]/90 backdrop-blur-md p-2 rounded-lg border border-[var(--border)] shadow-md text-[10px] space-y-1">
              <div className="font-bold text-[var(--text-secondary)] uppercase">Legend</div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /> Critical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" /> Severe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04]" /> Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" /> Minor
                </span>
                {showGeospatialZones && (
                  <span className="flex items-center gap-1 text-[#0B8F80] font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-[#DC2626]/40 border border-[#DC2626]" /> GIS Zones Active
                  </span>
                )}
              </div>
            </div>
          </div>

        {/* DISASTER EVENT TIMELINE */}
        {(viewMode === 'split' || viewMode === 'timeline_only') && (
          <div
            className={`${
              viewMode === 'timeline_only' ? 'lg:col-span-12' : 'lg:col-span-5'
            } flex flex-col space-y-3.5`}
          >
            {/* Timeline Header & Count */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#0B8F80]" />
                  Disaster Event Timeline
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Showing {paginatedIncidents.length} of {filteredIncidents.length} matching events
                </p>
              </div>

              {/* Page size dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-[var(--bg-sunken)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={999}>All</option>
                </select>
              </div>
            </div>

            {/* Event Cards List */}
            {filteredIncidents.length === 0 ? (
              <div className="neu-sunken p-8 rounded-2xl text-center space-y-3 border border-[var(--border)]">
                <HelpCircle className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">No Disaster Events Found</h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  No records match your selected filters. Try broadening the state or category filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedState('all');
                    setSelectedCategory('all');
                    setSelectedCategoryGroup('all');
                    setSelectedSeverity('all');
                    setSelectedStatus('all');
                  }}
                  className="neu-btn-primary px-3 py-1.5 text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
                {paginatedIncidents.map((inc) => {
                  const isSelected = activeIncident?.id === inc.id;
                  const sevColor = getSeverityColor(inc.severity);

                  return (
                    <div
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`neu-raised rounded-xl p-3.5 border transition-all cursor-pointer hover:border-[#0B8F80] ${
                        isSelected
                          ? 'border-2 border-[#0B8F80] bg-[#0B8F80]/5 shadow-md'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded">
                            {inc.id}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: sevColor }}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--bg-sunken)] text-[var(--text-secondary)]">
                            {inc.categoryLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded-full">
                          {inc.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-[var(--text-primary)] leading-snug mb-1">
                        {inc.title}
                      </h4>

                      {/* WHERE IT HAPPENED: CLICKABLE LOCATION BADGE */}
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2 flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlyToLocation(inc);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B8F80]/15 hover:bg-[#0B8F80] text-[#0B8F80] hover:text-white font-bold transition-all text-[11px] cursor-pointer shadow-2xs group border border-[#0B8F80]/30"
                          title="Click to view exact location directly on the map"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0B8F80] group-hover:text-white group-hover:scale-110" />
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 group-hover:opacity-100">Where it happened:</span>
                          <span className="truncate max-w-[190px]">
                            {inc.locality ? `${inc.locality}, ` : ''}{inc.district}, {inc.state}
                          </span>
                          <span className="text-[9.5px] font-mono bg-white/40 dark:bg-black/30 px-1 rounded ml-1 font-semibold">
                            Show on Map ↗
                          </span>
                        </button>

                        <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                          <Clock className="w-3 h-3" />
                          {inc.incidentDate}
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2.5">
                        {inc.shortDescription}
                      </p>

                      {/* Casualties / Impact Strip */}
                      <div className="grid grid-cols-4 gap-1.5 bg-[var(--bg-sunken)] p-1.5 rounded-lg text-center text-[10px] mb-2.5">
                        <div>
                          <span className="text-[var(--text-muted)] block">Deaths</span>
                          <span className="font-extrabold text-[#DC2626]">
                            {inc.humanImpact.deathsConfirmed ?? 'Not Reported'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Injured</span>
                          <span className="font-extrabold text-[#EA580C]">
                            {inc.humanImpact.injuredConfirmed ?? 'Not Reported'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Rescued</span>
                          <span className="font-extrabold text-[#0B8F80]">
                            {inc.humanImpact.rescued ?? 'Not Reported'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block">Evacuated</span>
                          <span className="font-extrabold text-[#2563EB]">
                            {inc.humanImpact.evacuated ?? 'Not Reported'}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs">
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[170px]" title={inc.dataSource}>
                          Src: {inc.dataSource}
                        </span>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectIncident(inc);
                            }}
                            className="neu-btn px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[#0B8F80] cursor-pointer"
                          >
                            Full Details →
                          </button>
                          {/* REPLACED OLD 'LIVE GIS' BUTTON: SHOWS EXACT LOCATION WHERE INCIDENT HAPPENED DIRECTLY ON THE MAP */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlyToLocation(inc);
                            }}
                            className="neu-btn-primary px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 bg-[#0B8F80] text-white hover:bg-[#097568] transition-all cursor-pointer shadow-xs rounded-lg"
                            title={`Show ${inc.locality ? `${inc.locality}, ` : ''}${inc.district} directly on the map`}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-bold truncate max-w-[210px]">
                              {inc.locality ? `${inc.locality}, ` : ''}{inc.district} · Show on Map
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                <span className="text-[var(--text-muted)]">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="neu-btn px-2.5 py-1 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="neu-btn px-2.5 py-1 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* -----------------------------------------------------------------
          SECTION 6: COMPLETE DISASTER INCIDENT DETAILS SLIDE-IN PANEL
      ----------------------------------------------------------------- */}
      {/* Docked Compact Card when Minimized to view map */}
      {activeIncident && isDrawerMinimized && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm sm:max-w-md w-full bg-[var(--bg-canvas)]/95 backdrop-blur-md border border-[#0B8F80]/50 rounded-xl shadow-2xl p-3.5 space-y-2 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B8F80] animate-ping shrink-0" />
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                {activeIncident.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerMinimized(false)}
                className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-bold hover:bg-[#097568] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title="Expand full incident report"
              >
                <span>Full Details</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveIncident(null);
                  setIsDrawerMinimized(false);
                }}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span className="truncate">
              📍 {activeIncident.locality ? `${activeIncident.locality}, ` : ''}{activeIncident.district}, {activeIncident.state}
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 ml-1"
              style={{ backgroundColor: getSeverityColor(activeIncident.severity) }}
            >
              {activeIncident.severity}
            </span>
          </div>
        </div>
      )}

      {/* Full Slide-in Details Panel (when not minimized) */}
      {activeIncident && !isDrawerMinimized && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[var(--bg-canvas)] border-l border-[var(--border)] shadow-2xl flex flex-col transform transition-transform duration-300">
          {/* Drawer Top Header */}
          <div className="px-5 py-3.5 bg-[var(--bg-raised)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded">
                {activeIncident.id}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: getSeverityColor(activeIncident.severity) }}
              >
                {activeIncident.severity}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-sunken)] text-[var(--text-primary)]">
                {activeIncident.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* WHERE IT HAPPENED: DIRECT SHOW ON MAP BUTTON IN PLACE OF LIVE GIS */}
              <button
                type="button"
                onClick={() => handleFlyToLocation(activeIncident)}
                className="neu-btn-primary px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer bg-[#0B8F80] hover:bg-[#097568] text-white"
                title={`Show ${activeIncident.locality ? `${activeIncident.locality}, ` : ''}${activeIncident.district} on the map`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {activeIncident.locality ? `${activeIncident.locality}, ` : ''}{activeIncident.district} · Show on Map
                </span>
              </button>

              {/* MINIMIZE TO VIEW MAP */}
              <button
                type="button"
                onClick={() => setIsDrawerMinimized(true)}
                className="neu-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Minimize drawer to view map"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveIncident(null);
                  setIsDrawerMinimized(false);
                }}
                className="neu-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Close Report Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)] leading-tight mb-1">
                {activeIncident.title}
              </h2>

              {/* Direct interactive Where It Happened location pill */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleFlyToLocation(activeIncident)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B8F80] hover:bg-[#097568] text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                  title="Click to view exact location directly on the map"
                >
                  <MapPin className="w-4 h-4 animate-bounce" />
                  <span>
                    Where it happened: {activeIncident.locality ? `${activeIncident.locality}, ` : ''}{activeIncident.district}, {activeIncident.state}
                  </span>
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-mono font-bold ml-1">
                    Show on Map ↗
                  </span>
                </button>

                <span className="text-xs text-[var(--text-secondary)] font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {activeIncident.incidentDate} at {activeIncident.incidentTime || 'Not Reported'}
                </span>
              </div>
            </div>

            {/* A. INCIDENT OVERVIEW */}
            <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2.5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0B8F80] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Section A: Incident Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">Category</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeIncident.categoryLabel}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">Disaster Group</span>
                  <span className="font-bold capitalize text-[var(--text-primary)]">{activeIncident.categoryGroup.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">Operational Status</span>
                  <span className="font-bold text-[#0B8F80]">{activeIncident.status}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">State / UT</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeIncident.state}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">District</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeIncident.district}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10.5px]">Locality</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeIncident.locality || 'Not Reported'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[var(--text-muted)] block text-[10.5px]">Verified Coordinates</span>
                  {activeIncident.coordinatesVerified && typeof activeIncident.lat === 'number' && typeof activeIncident.lng === 'number' ? (
                    <span className="font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B8F80]" />
                      Lat: {activeIncident.lat.toFixed(4)}°N, Lng: {activeIncident.lng.toFixed(4)}°E
                      <button
                        type="button"
                        onClick={() => handleFlyToLocation(activeIncident)}
                        className="text-[10px] bg-[#0B8F80] text-white px-2 py-0.5 rounded font-sans hover:bg-[#09776b] ml-1"
                      >
                        Fly to Point ↗
                      </button>
                    </span>
                  ) : (
                    <span className="text-xs text-[#EA580C] font-semibold flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Precise GPS coordinates unavailable — Mapped by administrative locality
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* B. HUMAN IMPACT */}
            <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2.5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#DC2626] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Section B: Human Impact (Casualties & Displaced)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Confirmed Deaths</span>
                  <span className="text-sm font-black text-[#DC2626]">
                    {activeIncident.humanImpact.deathsConfirmed ?? 'Not Reported'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Provisional Deaths</span>
                  <span className="text-sm font-black text-[#EA580C]">
                    {activeIncident.humanImpact.deathsProvisional ?? '0'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Injured</span>
                  <span className="text-sm font-black text-[#EA580C]">
                    {activeIncident.humanImpact.injuredConfirmed ?? 'Not Reported'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Missing</span>
                  <span className="text-sm font-black text-[#9333EA]">
                    {activeIncident.humanImpact.missing ?? '0'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Rescued</span>
                  <span className="text-sm font-black text-[#0B8F80]">
                    {activeIncident.humanImpact.rescued ? activeIncident.humanImpact.rescued.toLocaleString() : 'Not Reported'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Evacuated</span>
                  <span className="text-sm font-black text-[#2563EB]">
                    {activeIncident.humanImpact.evacuated ? activeIncident.humanImpact.evacuated.toLocaleString() : 'Not Reported'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">People Affected</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">
                    {activeIncident.humanImpact.peopleAffected ? activeIncident.humanImpact.peopleAffected.toLocaleString() : 'Not Reported'}
                  </span>
                </div>
                <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                  <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold block">Families Affected</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">
                    {activeIncident.humanImpact.familiesAffected ? activeIncident.humanImpact.familiesAffected.toLocaleString() : 'Not Reported'}
                  </span>
                </div>
              </div>

              {activeIncident.humanImpact.historicalRevisionNote && (
                <div className="p-2 bg-[#CA8A04]/10 border border-[#CA8A04]/30 rounded-lg text-xs text-[#CA8A04] flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Casualty Verification Note: </span>
                    {activeIncident.humanImpact.historicalRevisionNote}
                  </div>
                </div>
              )}
            </div>

            {/* C. WHAT ACTUALLY HAPPENED? */}
            <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2.5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0284C7] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Section C: What Actually Happened?
              </h3>
              <div className="space-y-2.5 text-xs text-[var(--text-primary)] leading-relaxed">
                <div>
                  <span className="font-bold text-[var(--text-secondary)] block mb-0.5">Narrative:</span>
                  <p>{activeIncident.chronology.whatHappened}</p>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-secondary)] block mb-0.5">How It Began:</span>
                  <p>{activeIncident.chronology.howItBegan}</p>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-secondary)] block mb-1">Reported Causes:</span>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[var(--text-secondary)]">
                    {activeIncident.chronology.reportedCauses.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-secondary)] block mb-1">
                    Affected Areas (Click to View on Map):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeIncident.chronology.affectedAreas.map((area, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFlyToLocation(activeIncident, area)}
                        className="bg-[var(--bg-canvas)] border border-[#0B8F80]/30 hover:border-[#0B8F80] hover:bg-[#0B8F80] hover:text-white px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                        title={`Locate ${area} on map`}
                      >
                        <MapPin className="w-3 h-3 text-[#0B8F80]" />
                        <span>{area}</span>
                        <span className="opacity-70 text-[9px]">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-secondary)] block mb-0.5">Current Situation on Ground:</span>
                  <p className="text-[#0B8F80] font-semibold">{activeIncident.chronology.currentSituation}</p>
                </div>
              </div>
            </div>

            {/* D. DAMAGE ASSESSMENT */}
            {activeIncident.damageAssessment && (
              <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2.5">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#EA580C] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Section D: Damage Assessment
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                    <span className="text-[9.5px] text-[var(--text-muted)] uppercase block">Houses Damaged</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {activeIncident.damageAssessment.housesDamaged ?? 'Not Reported'}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                    <span className="text-[9.5px] text-[var(--text-muted)] uppercase block">Roads Damaged</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {activeIncident.damageAssessment.roadsDamagedKm ? `${activeIncident.damageAssessment.roadsDamagedKm} km` : 'Not Reported'}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                    <span className="text-[9.5px] text-[var(--text-muted)] uppercase block">Agricultural Land</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {activeIncident.damageAssessment.agriculturalLandHa ? `${activeIncident.damageAssessment.agriculturalLandHa} Ha` : 'Not Reported'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)]">
                    <span className="text-[9.5px] text-[var(--text-muted)] uppercase block">Estimated Loss</span>
                    <span className="text-xs font-black text-[#DC2626]">
                      {activeIncident.damageAssessment.estimatedLossInrCrores ? `₹ ${activeIncident.damageAssessment.estimatedLossInrCrores} Crores` : 'Under Assessment'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* E. EMERGENCY RESPONSE */}
            {activeIncident.emergencyResponse && (
              <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2.5">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0B8F80] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Section E: Emergency Response
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-[var(--bg-canvas)] rounded-lg border border-[var(--border)] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activeIncident.emergencyResponse.ndrfDeployed ? 'bg-[#0B8F80]' : 'bg-[var(--text-muted)]'}`} />
                      <span className="font-bold text-[var(--text-primary)]">
                        NDRF Deployment: {activeIncident.emergencyResponse.ndrfDeployed ? 'Confirmed' : 'Not Deployed'}
                      </span>
                    </div>
                    {activeIncident.emergencyResponse.ndrfBattalionDetails && (
                      <p className="text-[11px] text-[var(--text-secondary)] pl-4">
                        {activeIncident.emergencyResponse.ndrfBattalionDetails}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-[var(--text-secondary)] block text-[10.5px]">District Admin:</span>
                    <p className="text-[var(--text-primary)]">{activeIncident.emergencyResponse.districtAdminResponse}</p>
                  </div>

                  {activeIncident.emergencyResponse.exGratiaAnnouncements && (
                    <div className="p-2 bg-[#0B8F80]/10 border border-[#0B8F80]/30 rounded-lg text-xs text-[#0B8F80]">
                      <span className="font-bold">Relief Package: </span>
                      {activeIncident.emergencyResponse.exGratiaAnnouncements}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* F. EVIDENCE AND CITATIONS */}
            <div className="neu-sunken p-3.5 rounded-xl border border-[var(--border)] space-y-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0B8F80]" />
                Section F: Evidence and Citations
              </h3>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] text-[10.5px] block">Source Agency</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeIncident.dataSource}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-[10.5px] block">Last Official Update</span>
                  <span className="font-mono text-[var(--text-secondary)]">{activeIncident.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="px-5 py-3 bg-[var(--bg-raised)] border-t border-[var(--border)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveIncident(null)}
              className="neu-btn px-3 py-1.5 text-xs font-semibold"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFlyToLocation(activeIncident)}
                className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 bg-[#0B8F80] hover:bg-[#097568] text-white cursor-pointer rounded-lg shadow-sm"
                title={`Show ${activeIncident.locality ? `${activeIncident.locality}, ` : ''}${activeIncident.district} on the map`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Show {activeIncident.locality ? `${activeIncident.locality}, ` : ''}{activeIncident.district} on Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
