import { z } from 'zod';

/**
 * Shared Zod schemas for validating external API payloads and user forms (Section 8.3 & 9.2).
 */

export const OpenMeteoWeatherSchema = z.object({
  current: z
    .object({
      temperature_2m: z.number().optional(),
      relative_humidity_2m: z.number().optional(),
      precipitation: z.number().optional(),
      wind_speed_10m: z.number().optional(),
    })
    .optional(),
  daily: z
    .object({
      time: z.array(z.string()).optional(),
      precipitation_sum: z.array(z.number()).optional(),
      temperature_2m_max: z.array(z.number()).optional(),
    })
    .optional(),
});

export const OpenMeteoElevationSchema = z.object({
  elevation: z.array(z.number()).nonempty(),
});

export const UsgsFeatureSchema = z.object({
  id: z.string(),
  properties: z.object({
    mag: z.number().nullable().optional(),
    place: z.string().nullable().optional(),
    time: z.number().nullable().optional(),
  }),
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number(), z.number().optional()]),
  }),
});

export const UsgsFeedSchema = z.object({
  features: z.array(UsgsFeatureSchema),
});

export const NominatimItemSchema = z.object({
  place_id: z.union([z.number(), z.string()]).optional(),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
});

export const NominatimResponseSchema = z.array(NominatimItemSchema);

export const OsrmRouteResponseSchema = z.object({
  routes: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        geometry: z.object({
          coordinates: z.array(z.tuple([z.number(), z.number()])),
        }),
      })
    )
    .nonempty(),
});

/**
 * Form & Mutation Schemas
 */
export const SosSubmissionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(50000),
  note: z.string().max(280).optional(),
  manualLocationText: z.string().max(200).optional(),
});

export const PublicHazardReportSchema = z.object({
  villageId: z.string().min(1).max(64),
  category: z.enum([
    'ground_crack',
    'water_seepage',
    'rockfall',
    'flood_level',
    'road_blocked',
    'embankment_breach',
    'structure_damage',
  ]),
  description: z.string().min(5, 'Enter at least 5 characters describing the hazard.').max(600),
  reporterName: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  honeypot: z.string().max(0, 'Bot submission rejected.').optional(),
});

export const PartnerAccessRequestSchema = z.object({
  orgName: z.string().min(3).max(140),
  registrationNumber: z.string().min(3).max(80),
  contactPerson: z.string().min(2).max(100),
  officialEmail: z.string().email().max(140),
  phone: z.string().regex(/^[0-9+\-\s]{8,16}$/, 'Enter a valid phone number'),
  districtScope: z.string().min(2).max(80),
  purpose: z.string().min(10).max(600),
  documentFileName: z.string().min(3).max(120),
});
