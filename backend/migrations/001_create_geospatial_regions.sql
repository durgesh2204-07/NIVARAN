-- ==============================================================================
-- NIVARAN GIS PLATFORM - ADMINISTRATIVE BOUNDARIES & GEOSPATIAL ANALYSIS SCHEMA
-- Database: nivaran_gis_db
-- Target: PostgreSQL 14+ with PostGIS 3.0+
-- ==============================================================================

-- 1. Enable PostGIS Extension if not already active
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. States / Union Territories Table (Level 2)
CREATE TABLE IF NOT EXISTS states (
    id VARCHAR(64) PRIMARY KEY,
    state_code VARCHAR(16) UNIQUE NOT NULL,
    state_name VARCHAR(128) NOT NULL,
    country_code VARCHAR(8) DEFAULT 'IN',
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    area_sq_km NUMERIC(12, 2),
    source_id VARCHAR(64) DEFAULT 'Survey of India / Bharatmaps',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_states_geom_valid CHECK (ST_IsValid(geometry))
);

CREATE INDEX IF NOT EXISTS idx_states_geom ON states USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_states_code ON states (state_code);
CREATE INDEX IF NOT EXISTS idx_states_name ON states (state_name);

-- 3. Districts Table (Level 3)
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(64) PRIMARY KEY,
    district_code VARCHAR(16) UNIQUE NOT NULL,
    district_name VARCHAR(128) NOT NULL,
    state_id VARCHAR(64) NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    area_sq_km NUMERIC(12, 2),
    source_id VARCHAR(64) DEFAULT 'Census of India / LGD / Mahabhumi GIS',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_districts_geom_valid CHECK (ST_IsValid(geometry))
);

CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts (state_id);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts (district_name);

-- 4. Talukas / Tehsils / Subdistricts Table (Level 4)
CREATE TABLE IF NOT EXISTS talukas (
    id VARCHAR(64) PRIMARY KEY,
    taluka_code VARCHAR(16) UNIQUE NOT NULL,
    taluka_name VARCHAR(128) NOT NULL,
    district_id VARCHAR(64) NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    area_sq_km NUMERIC(12, 2),
    source_id VARCHAR(64) DEFAULT 'Maharashtra Revenue & Forest Dept / Survey of India',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_talukas_geom_valid CHECK (ST_IsValid(geometry))
);

CREATE INDEX IF NOT EXISTS idx_talukas_geom ON talukas USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_talukas_district ON talukas (district_id);
CREATE INDEX IF NOT EXISTS idx_talukas_name ON talukas (taluka_name);

-- 5. Villages / Revenue Settlements Table (Level 5)
CREATE TABLE IF NOT EXISTS villages (
    id VARCHAR(64) PRIMARY KEY,
    village_code VARCHAR(32) UNIQUE NOT NULL,
    village_name VARCHAR(128) NOT NULL,
    taluka_id VARCHAR(64) NOT NULL REFERENCES talukas(id) ON DELETE CASCADE,
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    area_sq_km NUMERIC(12, 2),
    population INTEGER DEFAULT 0,
    households INTEGER DEFAULT 0,
    elevation_m NUMERIC(8, 2),
    slope_deg NUMERIC(6, 2),
    source_id VARCHAR(64) DEFAULT 'LGD Census Directorate / Mahabhumi GeoPortal',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_villages_geom_valid CHECK (ST_IsValid(geometry))
);

CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_villages_taluka ON villages (taluka_id);
CREATE INDEX IF NOT EXISTS idx_villages_name ON villages (village_name);

-- 6. Geospatial Analyses Table (Analysis Runs & Risk Index Logs)
CREATE TABLE IF NOT EXISTS geospatial_analyses (
    id VARCHAR(64) PRIMARY KEY,
    region_type VARCHAR(32) NOT NULL, -- country, state, district, taluka, village
    region_id VARCHAR(64) NOT NULL,
    hazard_type VARCHAR(64) NOT NULL, -- multi_hazard, landslide, flood, cyclone
    analysis_unit VARCHAR(32) NOT NULL, -- grid_cell, village, taluka, district
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    risk_score NUMERIC(6, 2) NOT NULL, -- 0.00 to 100.00
    risk_category VARCHAR(32) NOT NULL, -- Very High, High, Moderate, Low, Very Low
    data_completeness NUMERIC(5, 2) DEFAULT 100.00, -- percentage
    methodology_version VARCHAR(32) DEFAULT 'NIVARAN-MCDA-v2.0',
    source_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analyses_region ON geospatial_analyses (region_type, region_id);
CREATE INDEX IF NOT EXISTS idx_analyses_date ON geospatial_analyses (analysis_date);
CREATE INDEX IF NOT EXISTS idx_analyses_score ON geospatial_analyses (risk_score);

