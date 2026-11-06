import { describe, expect, it } from 'vitest';
import { authorize, maskSensitiveField } from '../authorize';
import {
  escapeCsvCell,
  safeParse,
  sanitizeInput,
  validateCoordinates,
  validateUploadFile,
} from '../sanitize';
import { z } from 'zod';
import { UserProfile } from '../../types';

describe('Security, Authorisation & Input Sanitisation (Section 7 & 8)', () => {
  const adminUser: UserProfile = {
    id: 'usr-admin',
    name: 'Dr. R. Deshmukh',
    emailOrPhone: 'admin@nivaran.gov.in',
    role: 'administrator',
    organisation: 'sdma',
    orgRole: 'Administrator',
    jurisdictionLevel: 'State',
    designation: 'State Relief Commissioner',
    district: 'All Districts',
  };

  const ddmaRaigadUser: UserProfile = {
    id: 'usr-ddma',
    name: 'Collector Raigad',
    emailOrPhone: 'collector.raigad@gov.in',
    role: 'district_officer',
    organisation: 'ddma',
    orgRole: 'Approver',
    jurisdictionLevel: 'District',
    designation: 'District Collector',
    district: 'Raigad',
  };

  const partnerUser: UserProfile = {
    id: 'usr-partner',
    name: 'Red Cross Coordinator',
    emailOrPhone: 'relief@indianredcross.org',
    role: 'partner_org',
    organisation: 'partners',
    orgRole: 'Operator',
    jurisdictionLevel: 'District',
    designation: 'Relief Partner',
    district: 'Raigad',
  };

  describe('authorize()', () => {
    it('permits public SOS and hazard reporting without authentication', () => {
      expect(authorize(null, 'submit:public_sos').allowed).toBe(true);
      expect(authorize(undefined, 'submit:public_report').allowed).toBe(true);
    });

    it('denies unauthenticated users on protected actions with 401', () => {
      const dec = authorize(null, 'edit:scoring_weights');
      expect(dec.allowed).toBe(false);
      expect(dec.status).toBe(401);
    });

    it('enforces role matrix (only Administrator can edit scoring weights)', () => {
      expect(authorize(adminUser, 'edit:scoring_weights').allowed).toBe(true);
      const ddmaDec = authorize(ddmaRaigadUser, 'edit:scoring_weights');
      expect(ddmaDec.allowed).toBe(false);
      expect(ddmaDec.status).toBe(403);
      expect(ddmaDec.code).toBe('FORBIDDEN_ROLE');
    });

    it('enforces jurisdiction scoping across districts', () => {
      expect(
        authorize(ddmaRaigadUser, 'approve:relocation_plan', { district: 'Raigad' }).allowed
      ).toBe(true);

      const crossDistrict = authorize(ddmaRaigadUser, 'approve:relocation_plan', {
        district: 'Satara',
      });
      expect(crossDistrict.allowed).toBe(false);
      expect(crossDistrict.status).toBe(403);
      expect(crossDistrict.code).toBe('FORBIDDEN_JURISDICTION');
    });

    it('restricts partner organisations to relief & resource tasks only', () => {
      expect(
        authorize(partnerUser, 'manage:resources', {
          district: 'Raigad',
          resourceType: 'relief_task',
        }).allowed
      ).toBe(true);

      const forbiddenIncident = authorize(partnerUser, 'issue:cap_alert', {
        district: 'Raigad',
      });
      expect(forbiddenIncident.allowed).toBe(false);
      expect(forbiddenIncident.code).toBe('FORBIDDEN_ORG');
    });
  });

  describe('maskSensitiveField()', () => {
    it('masks phone numbers, household head names, and coordinates unless revealed', () => {
      expect(maskSensitiveField('9876543210', 'phone', false)).toBe('•••• ••3210');
      expect(maskSensitiveField('9876543210', 'phone', true)).toBe('9876543210');
      expect(maskSensitiveField('Ramesh Pardhi', 'name', false)).toContain('R•••••');
      expect(maskSensitiveField('18.9265, 73.2361', 'coordinates', false)).toContain('(masked)');
    });
  });

  describe('sanitizeInput() & escapeCsvCell()', () => {
    it('strips HTML script tags, control characters, and caps length', () => {
      const hostile = '\u0000<script>alert("xss")</script>Crack near scarp\u0007';
      const clean = sanitizeInput(hostile, 50);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('\u0000');
      expect(clean).toContain('Crack near scarp');
    });

    it('prevents CSV formula injection on cells starting with =, +, -, @', () => {
      expect(escapeCsvCell('=CMD|\' /C calc\'!A0')).toBe("'=CMD|' /C calc'!A0");
      expect(escapeCsvCell('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
      expect(escapeCsvCell('-2+3')).toBe("'-2+3");
      expect(escapeCsvCell('@import')).toBe("'@import");
      expect(escapeCsvCell('Irshalwadi')).toBe('Irshalwadi');
    });
  });

  describe('safeParse() & validateCoordinates()', () => {
    it('safely parses JSON and validates against a Zod schema without throwing', () => {
      const schema = z.object({ count: z.number() });
      const good = safeParse('{"count": 42}', schema);
      expect(good.ok).toBe(true);

      const badJson = safeParse('{malformed', schema);
      expect(badJson.ok).toBe(false);

      const badShape = safeParse('{"count": "not-a-number"}', schema);
      expect(badShape.ok).toBe(false);
    });

    it('validates coordinates and warns when outside Indian bounds', () => {
      const maha = validateCoordinates(18.9265, 73.2361);
      expect(maha.valid).toBe(true);
      expect(maha.inIndiaBounds).toBe(true);

      const outOfIndia = validateCoordinates(51.5074, -0.1278);
      expect(outOfIndia.valid).toBe(true);
      expect(outOfIndia.inIndiaBounds).toBe(false);
      expect(outOfIndia.warning).toBeDefined();

      const invalid = validateCoordinates(195, -400);
      expect(invalid.valid).toBe(false);
    });
  });

  describe('validateUploadFile()', () => {
    it('rejects oversized uploads, disallowed extensions, magic byte mismatches, and XXE payloads', () => {
      expect(
        validateUploadFile({ name: 'malware.exe', size: 1024 }, 'photo').valid
      ).toBe(false);

      expect(
        validateUploadFile({ name: 'huge.jpg', size: 12 * 1024 * 1024 }, 'photo').valid
      ).toBe(false);

      // Fake JPEG with wrong magic bytes
      expect(
        validateUploadFile(
          {
            name: 'spoof.jpg',
            size: 2048,
            headerBytes: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
          },
          'photo'
        ).valid
      ).toBe(false);

      // KML containing XML External Entity (XXE)
      expect(
        validateUploadFile(
          {
            name: 'boundary.kml',
            size: 4096,
            textSample: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
          },
          'geodata'
        ).valid
      ).toBe(false);

      // Valid JPEG
      expect(
        validateUploadFile(
          {
            name: 'scarp_crack.jpg',
            size: 512 * 1024,
            headerBytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
          },
          'photo'
        ).valid
      ).toBe(true);
    });
  });
});
