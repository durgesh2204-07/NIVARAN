import React from 'react';
import {
  MapLibreEngine,
  MapLibreEngineProps,
  RIVER_PATHS as MAPLIBRE_RIVER_PATHS,
} from '../gis/MapLibreEngine';

export const RIVER_PATHS = MAPLIBRE_RIVER_PATHS;

export type NivaranMapProps = MapLibreEngineProps;

export const NivaranMap: React.FC<NivaranMapProps> = (props) => {
  return <MapLibreEngine {...props} />;
};
