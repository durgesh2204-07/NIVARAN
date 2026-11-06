import {
  GeospatialCountry,
  GeospatialState,
  GeospatialDistrict,
  GeospatialTaluka,
  GeospatialVillage,
  RegionSummary,
  RegionComparisonItem,
} from '../types/regions';

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (isHttps ? '' : 'http://127.0.0.1:8000');

export interface SearchRegionResult {
  id: string;
  name: string;
  admin_level: string;
  parent: string;
  center: [number, number];
  bbox: [number, number, number, number];
}

export interface AnalysisResponse {
  status: string;
  region_id: string;
  region_name: string;
  region_type: string;
  analysis_unit: string;
  hazard_type: string;
  units_generated_count: number;
  feature_collection: GeoJSON.FeatureCollection;
  summary: RegionSummary;
}

export const spatialRegionsApi = {
  async getCountries(): Promise<GeospatialCountry[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/countries`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.countries || [];
    } catch (err) {
      console.warn('Fallback country data due to:', err);
      return [{
        id: 'country-in',
        country_code: 'IN',
        name: 'India',
        name_hi: 'भारत',
        admin_level: 'Country',
        area_sq_km: 3287263.0,
        center: [78.9629, 22.5937],
        bbox: [68.11, 6.75, 97.41, 37.10],
        states_count: 36,
        source: 'Survey of India / Bharatmaps National Geospatial Portal',
        updated_at: '2026-10-15T00:00:00Z',
      }];
    }
  },

  async getStates(countryId: string = 'country-in'): Promise<GeospatialState[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/states?country_id=${countryId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.states || [];
    } catch (err) {
      console.warn('Fallback states due to:', err);
      return [
        {
          id: 'state-mh',
          state_code: 'MH',
          name: 'Maharashtra',
          name_hi: 'महाराष्ट्र',
          admin_level: 'State',
          area_sq_km: 307713.0,
          center: [75.7139, 19.7515],
          bbox: [72.63, 15.60, 80.89, 22.02],
          districts_count: 36,
          source: 'Mahabhumi GeoPortal / Census Directorate Maharashtra',
          updated_at: '2026-10-20T00:00:00Z',
        },
        {
          id: 'state-gj',
          state_code: 'GJ',
          name: 'Gujarat',
          name_hi: 'गुजरात',
          admin_level: 'State',
          area_sq_km: 196024.0,
          center: [71.1924, 22.2587],
          bbox: [68.10, 20.10, 74.45, 24.70],
          districts_count: 33,
          source: 'Gujarat GIDB / Survey of India',
          updated_at: '2026-09-15T00:00:00Z',
        },
        {
          id: 'state-ka',
          state_code: 'KA',
          name: 'Karnataka',
          name_hi: 'कर्नाटक',
          admin_level: 'State',
          area_sq_km: 191791.0,
          center: [75.7139, 15.3173],
          bbox: [74.05, 11.59, 78.58, 18.45],
          districts_count: 31,
          source: 'Karnataka KSRSAC / KSDMA',
          updated_at: '2026-09-10T00:00:00Z',
        },
      ];
    }
  },

  async getDistricts(stateId: string = 'state-mh'): Promise<GeospatialDistrict[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/districts?state_id=${stateId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.districts || [];
    } catch (err) {
      console.warn('Fallback districts due to:', err);
      return [
        {
          id: 'dist-pune',
          district_code: 'MH-PUN',
          name: 'Pune',
          name_hi: 'पुणे',
          state_id: 'state-mh',
          admin_level: 'District',
          area_sq_km: 15643.0,
          center: [73.8567, 18.5204],
          bbox: [73.25, 17.85, 75.15, 19.38],
          talukas_count: 14,
          source: 'District Administration Pune / MRSAC',
          updated_at: '2026-10-22T00:00:00Z',
        },
        {
          id: 'dist-raigad',
          district_code: 'MH-RAI',
          name: 'Raigad',
          name_hi: 'रायगड',
          state_id: 'state-mh',
          admin_level: 'District',
          area_sq_km: 7152.0,
          center: [73.2361, 18.9265],
          bbox: [72.85, 17.85, 73.55, 19.15],
          talukas_count: 15,
          source: 'Collector Office Raigad / District Disaster Management Authority',
          updated_at: '2026-10-24T00:00:00Z',
        },
      ];
    }
  },

  async getTalukas(districtId: string = 'dist-pune'): Promise<GeospatialTaluka[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/talukas?district_id=${districtId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.talukas || [];
    } catch (err) {
      console.warn('Fallback talukas due to:', err);
      return [
        {
          id: 'tal-maval',
          taluka_code: 'MH-PUN-MAV',
          name: 'Maval',
          name_hi: 'मावळ',
          district_id: 'dist-pune',
          admin_level: 'Taluka',
          area_sq_km: 1131.0,
          center: [73.55, 18.75],
          bbox: [73.35, 18.62, 73.75, 18.90],
          villages_count: 187,
          source: 'Tehsildar Office Vadgaon Maval / Pune DDMA',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 'tal-mulshi',
          taluka_code: 'MH-PUN-MUL',
          name: 'Mulshi',
          name_hi: 'मुळशी',
          district_id: 'dist-pune',
          admin_level: 'Taluka',
          area_sq_km: 1042.0,
          center: [73.50, 18.50],
          bbox: [73.30, 18.35, 73.70, 18.65],
          villages_count: 142,
          source: 'Tehsildar Office Paud Mulshi / Pune DDMA',
          updated_at: '2026-10-25T00:00:00Z',
        },
      ];
    }
  },

  async getVillages(talukaId: string = 'tal-maval'): Promise<GeospatialVillage[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/villages?taluka_id=${talukaId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.villages || [];
    } catch (err) {
      console.warn('Fallback villages due to:', err);
      return [
        {
          id: 'vil-lonavala',
          village_code: 'MH-PUN-MAV-01',
          name: 'Lonavala',
          name_hi: 'लोणावळा',
          taluka_id: 'tal-maval',
          admin_level: 'Village',
          area_sq_km: 38.0,
          center: [73.4072, 18.7557],
          bbox: [73.38, 18.73, 73.44, 18.78],
          population: 58000,
          households: 12500,
          elevation_m: 624.0,
          slope_deg: 24.5,
          source: 'Lonavala Municipal Council & Census Directorate',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 'vil-khandala',
          village_code: 'MH-PUN-MAV-02',
          name: 'Khandala',
          name_hi: 'खंडाळा',
          taluka_id: 'tal-maval',
          admin_level: 'Village',
          area_sq_km: 24.5,
          center: [73.3752, 18.7610],
          bbox: [73.35, 18.74, 73.40, 18.78],
          population: 14200,
          households: 3100,
          elevation_m: 550.0,
          slope_deg: 32.0,
          source: 'Gram Panchayat Khandala & Geological Survey of India',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 'vil-vadgaon',
          village_code: 'MH-PUN-MAV-03',
          name: 'Vadgaon Maval',
          name_hi: 'वडगाव मावळ',
          taluka_id: 'tal-maval',
          admin_level: 'Village',
          area_sq_km: 42.0,
          center: [73.6521, 18.7483],
          bbox: [73.62, 18.72, 73.68, 18.77],
          population: 32400,
          households: 7100,
          elevation_m: 615.0,
          slope_deg: 12.0,
          source: 'Nagar Panchayat Vadgaon Maval',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 'vil-kamshet',
          village_code: 'MH-PUN-MAV-04',
          name: 'Kamshet',
          name_hi: 'कामशेत',
          taluka_id: 'tal-maval',
          admin_level: 'Village',
          area_sq_km: 29.0,
          center: [73.5583, 18.7561],
          bbox: [73.53, 18.73, 73.58, 18.78],
          population: 18500,
          households: 4050,
          elevation_m: 630.0,
          slope_deg: 19.5,
          source: 'Gram Panchayat Kamshet',
          updated_at: '2026-10-25T00:00:00Z',
        },
      ];
    }
  },

  async searchRegions(q: string): Promise<SearchRegionResult[]> {
    if (!q || q.length < 2) return [];
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.warn('Search fallback:', err);
      return [];
    }
  },

  async getRegionBoundary(type: string, id: string): Promise<GeoJSON.Feature | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/${type}/${id}/boundary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Boundary fetch failed:', err);
      return null;
    }
  },

  async getRegionSummary(type: string, id: string): Promise<RegionSummary | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/gis/regions/${type}/${id}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Summary fetch failed:', err);
      return null;
    }
  },

  async analyzeRegion(params: {
    region_type: string;
    region_id: string;
    analysis_unit?: string;
    hazard_type?: string;
    grid_resolution_km?: number;
  }): Promise<AnalysisResponse> {
    const res = await fetch(`${BASE_URL}/api/gis/regions/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region_type: params.region_type,
        region_id: params.region_id,
        analysis_unit: params.analysis_unit || 'grid',
        hazard_type: params.hazard_type || 'multi_hazard',
        grid_resolution_km: params.grid_resolution_km || 1.5,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Analysis request failed');
    }
    return await res.json();
  },

  async compareRegions(regionIds: string[]): Promise<{ compared_count: number; regions: RegionComparisonItem[] }> {
    const res = await fetch(`${BASE_URL}/api/gis/regions/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region_ids: regionIds }),
    });
    if (!res.ok) {
      throw new Error('Comparison failed');
    }
    return await res.json();
  },
};
