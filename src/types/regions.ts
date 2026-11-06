export type AdministrativeLevel = 'country' | 'state' | 'district' | 'taluka' | 'village';

export interface GeospatialCountry {
  id: string;
  country_code: string;
  name: string;
  name_hi?: string;
  admin_level: 'Country';
  area_sq_km: number;
  center: [number, number];
  bbox: [number, number, number, number];
  states_count: number;
  source: string;
  updated_at: string;
}

export interface GeospatialState {
  id: string;
  state_code: string;
  name: string;
  name_hi?: string;
  admin_level: 'State';
  area_sq_km: number;
  center: [number, number];
  bbox: [number, number, number, number];
  districts_count: number;
  source: string;
  updated_at: string;
}

export interface GeospatialDistrict {
  id: string;
  district_code: string;
  name: string;
  name_hi?: string;
  state_id: string;
  admin_level: 'District';
  area_sq_km: number;
  center: [number, number];
  bbox: [number, number, number, number];
  talukas_count: number;
  source: string;
  updated_at: string;
}

export interface GeospatialTaluka {
  id: string;
  taluka_code: string;
  name: string;
  name_hi?: string;
  district_id: string;
  admin_level: 'Taluka';
  area_sq_km: number;
  center: [number, number];
  bbox: [number, number, number, number];
  villages_count: number;
  source: string;
  updated_at: string;
}

export interface GeospatialVillage {
  id: string;
  village_code: string;
  name: string;
  name_hi?: string;
  taluka_id: string;
  admin_level: 'Village';
  area_sq_km: number;
  center: [number, number];
  bbox: [number, number, number, number];
  population?: number;
  households?: number;
  elevation_m?: number;
  slope_deg?: number;
  source: string;
  updated_at: string;
}

export interface RegionSummary {
  region: {
    id: string;
    name: string;
    name_hi?: string;
    name_mr?: string;
    admin_level: string;
    area_sq_km: number;
    center: [number, number];
    bbox: [number, number, number, number];
    source: string;
    updated_at: string;
    villages_count?: number;
  };
  terrain: {
    elevation_mean_m: number;
    elevation_min_m: number;
    elevation_max_m: number;
    slope_mean_deg: number;
    aspect: string;
    terrain_variation: string;
    flow_accumulation_val: number;
  };
  weather_hydrology: {
    annual_rainfall_mm: number;
    monsoon_peak_mm: number;
    historical_max_rain_mm: number;
    river_proximity_km: number;
    drainage_density_km_per_sqkm: number;
    flood_risk_factor: string;
  };
  environmental: {
    land_use_land_cover: string;
    forest_canopy_percent: number;
    soil_type: string;
    geological_formation: string;
    surface_water_bodies: string;
  };
  population_infrastructure: {
    population_exposed: number;
    settlements_count: number;
    road_connectivity_index: string;
    critical_infra_count: number;
    healthcare_centers: number;
    evacuation_routes_count: number;
  };
  risk_assessment: {
    hazard_score: number;
    vulnerability_score: number;
    exposure_score: number;
    overall_risk_score: number;
    risk_category: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low';
    map_color: string;
    zonal_breakdown: {
      very_high_risk_sqkm: number;
      high_risk_sqkm: number;
      moderate_risk_sqkm: number;
      low_risk_sqkm: number;
    };
  };
  data_quality: {
    completeness_score: string;
    observation_period: string;
    spatial_resolution: string;
    last_surveyed: string;
  };
}

export interface RegionComparisonItem {
  id: string;
  name: string;
  admin_level: string;
  area_sq_km: number;
  mean_elevation_m: number;
  mean_slope_deg: number;
  annual_rainfall_mm: number;
  hazard_score: number;
  vulnerability_score: number;
  exposure_score: number;
  overall_risk_score: number;
  risk_category: string;
  color_hex: string;
  exposed_population: number;
  very_high_risk_area_sqkm: number;
}

