import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Strips ASCII control characters (except newline/tab when permitted),
 * removes HTML tags via DOMPurify, trims, and caps string length.
 */
export function sanitizeInput(
  input: unknown,
  maxLength = 500,
  allowNewlines = true
): string {
  if (input === null || input === undefined) return '';
  const raw = typeof input === 'string' ? input : String(input);

  // Strip control characters (0x00-0x1F and 0x7F), preserving \n and \t if allowNewlines is true
  const controlRegex = allowNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;

  const withoutControls = raw.replace(controlRegex, '');

  // Strip all HTML tags and attributes
  let stripped = withoutControls;
  if (typeof window !== 'undefined' && DOMPurify && typeof DOMPurify.sanitize === 'function') {
    stripped = DOMPurify.sanitize(withoutControls, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  } else {
    stripped = withoutControls.replace(/<[^>]*>/g, '');
  }

  const trimmed = stripped.trim();
  const safeCap = Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : 500;
  return trimmed.slice(0, safeCap);
}

/**
 * Sanitises rich text when explicitly needed using a strict allowlist of formatting tags.
 */
export function sanitizeRichText(html: unknown, maxLength = 4000): string {
  if (typeof html !== 'string') return '';
  const capped = html.slice(0, maxLength);
  if (typeof window !== 'undefined' && DOMPurify && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(capped, {
      ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'code'],
      ALLOWED_ATTR: [],
    });
  }
  return sanitizeInput(capped, maxLength);
}

/**
 * Escapes CSV cells starting with =, +, -, @, tab, or CR to prevent spreadsheet formula injection (Section 8.3).
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Defensive JSON + optional Zod schema parser that never throws (Section 7 & 9.4).
 */
export function safeParse<T = unknown>(
  rawJson: unknown,
  schema?: z.ZodType<T>
): { ok: true; data: T } | { ok: false; error: string } {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return { ok: false, error: 'Empty or non-string JSON input' };
  }
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (schema) {
      const result = schema.safeParse(parsed);
      if (!result.success) {
        const issue = result.error.issues[0];
        return {
          ok: false,
          error: `Validation failed at ${issue?.path.join('.') || 'root'}: ${issue?.message || 'invalid shape'}`,
        };
      }
      return { ok: true, data: result.data };
    }
    return { ok: true, data: parsed as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Malformed JSON payload',
    };
  }
}

export interface CoordinateValidationResult {
  valid: boolean;
  inIndiaBounds: boolean;
  lat: number;
  lng: number;
  warning?: string;
  error?: string;
}

/**
 * Validates geographic coordinates (-90..90, -180..180) and checks India bounding box (6..37.5 N, 68..97.5 E).
 */
export function validateCoordinates(latInput: unknown, lngInput: unknown): CoordinateValidationResult {
  const lat = typeof latInput === 'number' ? latInput : Number(latInput);
  const lng = typeof lngInput === 'number' ? lngInput : Number(lngInput);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      valid: false,
      inIndiaBounds: false,
      lat: 0,
      lng: 0,
      error: 'Coordinates must be finite numbers.',
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      valid: false,
      inIndiaBounds: false,
      lat,
      lng,
      error: 'Coordinates out of global bounds (lat -90..90, lng -180..180).',
    };
  }

  const inIndiaBounds = lat >= 6.0 && lat <= 37.6 && lng >= 68.0 && lng <= 97.5;
  return {
    valid: true,
    inIndiaBounds,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    warning: inIndiaBounds
      ? undefined
      : 'Coordinates lie outside standard Indian territorial bounds (6°N–37.6°N, 68°E–97.5°E).',
  };
}

export type UploadCategory = 'photo' | 'document' | 'geodata';

export interface UploadValidationInput {
  name: string;
  size: number;
  type?: string;
  headerBytes?: Uint8Array;
  textSample?: string;
}

export interface UploadValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedFileName: string;
}

const MAX_SIZE_BYTES: Record<UploadCategory, number> = {
  photo: 8 * 1024 * 1024, // 8 MB
  document: 10 * 1024 * 1024, // 10 MB
  geodata: 25 * 1024 * 1024, // 25 MB
};

const ALLOWED_EXTENSIONS: Record<UploadCategory, string[]> = {
  photo: ['.jpg', '.jpeg', '.png', '.webp'],
  document: ['.pdf', '.jpg', '.jpeg', '.png'],
  geodata: ['.geojson', '.json', '.kml', '.csv', '.zip', '.shp'],
};

/**
 * Validates uploaded files by extension, size limit, magic bytes (when available),
 * and rejects XML external entities (XXE) in KML/XML payloads (Section 8.3).
 */
export function validateUploadFile(
  file: UploadValidationInput,
  category: UploadCategory
): UploadValidationResult {
  const safeName = sanitizeInput(file.name, 120, false).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeName) {
    return { valid: false, reason: 'Missing file name.', sanitizedFileName: 'invalid' };
  }

  const maxBytes = MAX_SIZE_BYTES[category];
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, reason: 'File is empty.', sanitizedFileName: safeName };
  }
  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      reason: `File exceeds the ${limitMb} MB size limit for ${category}.`,
      sanitizedFileName: safeName,
    };
  }

  const lower = safeName.toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[category];
  const matchesExt = allowedExts.some((ext) => lower.endsWith(ext));
  if (!matchesExt) {
    return {
      valid: false,
      reason: `Unsupported file extension. Allowed: ${allowedExts.join(', ')}`,
      sanitizedFileName: safeName,
    };
  }

  // Magic byte verification if headerBytes are provided
  if (file.headerBytes && file.headerBytes.length >= 4) {
    const b = file.headerBytes;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
    const isZip = b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04; // PK..

    if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg')) && !isJpeg) {
      return { valid: false, reason: 'File signature does not match JPEG header.', sanitizedFileName: safeName };
    }
    if (lower.endsWith('.png') && !isPng) {
      return { valid: false, reason: 'File signature does not match PNG header.', sanitizedFileName: safeName };
    }
    if (lower.endsWith('.pdf') && !isPdf) {
      return { valid: false, reason: 'File signature does not match PDF header.', sanitizedFileName: safeName };
    }
    if (lower.endsWith('.zip') && !isZip) {
      return { valid: false, reason: 'File signature does not match ZIP archive header.', sanitizedFileName: safeName };
    }
  }

  // Reject XML external entities (XXE) or embedded scripts in KML/GeoJSON/CSV samples
  if (file.textSample) {
    const sample = file.textSample;
    if (/<!ENTITY/i.test(sample) || /<!DOCTYPE[^>]+SYSTEM/i.test(sample)) {
      return {
        valid: false,
        reason: 'Rejected KML/XML payload containing external entity declarations (XXE).',
        sanitizedFileName: safeName,
      };
    }
    if (/<script[\s>]/i.test(sample)) {
      return {
        valid: false,
        reason: 'Rejected file containing embedded script tags.',
        sanitizedFileName: safeName,
      };
    }
  }

  return { valid: true, sanitizedFileName: safeName };
}

/**
 * Validates tel: and mailto: targets before rendering actionable links.
 */
export function sanitizeTelHref(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (!/^\+?[0-9]{3,15}$/.test(cleaned)) {
    return 'tel:112';
  }
  return `tel:${cleaned}`;
}
