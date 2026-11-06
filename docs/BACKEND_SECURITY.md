# Nivaran Backend & Data Protection Security Specification (`docs/BACKEND_SECURITY.md`)

This document specifies the mandatory server-side controls required when deploying the Nivaran REST/PostGIS backend (`services/gateway.ts` → `/api/v1/*`) in State or National Data Centres (SDC / NDC).

---

## 1. Transport & Encryption
- **TLS Everywhere**: Enforce TLS 1.3 (minimum TLS 1.2 with AEAD ciphers) on all ingress load balancers, internal service-to-service links, and PostgreSQL/PostGIS connections (`sslmode=verify-full`).
- **Encryption at Rest**: Full-disk/volume encryption (AES-256-GCM) for PostgreSQL data directories, object storage buckets (field photos, KML/GeoJSON uploads, Relocation Order PDFs), and backup snapshots.
- **Field-Level Encryption (PII)**: Encrypt household head names, mobile numbers, bank/DBT account identifiers, and exact coordinates of vulnerable individuals at the application layer using envelope encryption (KMS-managed DEKs) prior to database persistence.

## 2. Authentication, Sessions & Secret Management
- **Password Hashing**: Hash all staff credentials using **Argon2id** (`m=65536, t=3, p=4`) with unique per-record cryptographic salts.
- **Token Architecture**:
  - Short-lived access tokens (15-minute expiry) held in client memory only (`services/gateway.ts`).
  - Refresh tokens issued exclusively inside `httpOnly; Secure; SameSite=Strict; Path=/api/v1/auth` cookies.
  - Double-submit CSRF verification via the `X-CSRF-Token` header on all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Step-Up MFA & Re-Authentication**: Require TOTP / hardware token step-up for Administrators and Approvers, and require re-authentication before approving relocation plans, modifying hazard scoring weights, issuing Red-level CAP alerts, or exporting personal data.
- **Secret Manager**: Store all third-party keys (SMS/CAP gateway, WhatsApp Business API, Jan Parichay SSO client secrets, database credentials) in a dedicated hardware/cloud Secret Manager. Zero secrets in environment files or container images.

## 3. Database Security & Access Control
- **Parameterised Queries Only**: All SQL and PostGIS spatial queries (`ST_Contains`, `ST_DWithin`, `ST_Buffer`) must use bound parameters. Never interpolate user input into SQL strings.
- **Least-Privilege DB Roles**: Separate PostgreSQL roles for `nivaran_app_rw` (DML only, no `DROP`/`TRUNCATE`), `nivaran_analytics_ro` (read-only views with masked PII), and `nivaran_audit_append` (`INSERT`-only on the audit ledger table).
- **Server-Side Authorisation**: Replicate the exact deny-by-default [`authorize(user, action, resource)`](file:///c:/Users/Durgesh/Downloads/pccoe/src/security/authorize.ts) engine on every API endpoint, enforcing organisation, role, and jurisdiction hierarchy (`National > State > District > Block > Village`).

## 4. Rate Limiting & Abuse Controls (Matching Client Rules)
| Endpoint Category | Limit | Scope | Action on Breach |
| :--- | :--- | :--- | :--- |
| **Login (`/api/v1/auth/login`)** | 5 attempts / 15 min | Per account & per IP | 15-minute account lock + security event |
| **Emergency SOS (`/api/v1/sos`)** | 1 active SOS / 2 min | Per device fingerprint / IP | Merge duplicate into active SOS as "Update" |
| **Public Hazard Report** | 5 reports / hour | Per device / IP | HTTP `429` with `Retry-After` |
| **Geocoding Proxy** | 1 request / second | Per client session | Queue / throttle with HTTP `429` |

## 5. Tamper-Evident Audit Logs & Backups
- **Hash-Chained Audit Ledger**: Every sensitive action (weight modification, plan approval, CAP broadcast, PII reveal, case stage transition) appends a SHA-256 hash chaining the previous record's digest (`prevHash`).
- **Daily Encrypted Backups & Tested Restores**: Automated daily full backups + continuous WAL archiving to an isolated vault, with automated monthly restore drills onto a staging PostGIS cluster.

## 6. WAF, Scanning & Incident Response
- **WAF & DDoS Protection**: Deploy an OWASP Core Rule Set WAF and L3/L4/L7 DDoS mitigation in front of `/api/*`, while whitelisting emergency `/api/v1/sos` traffic for priority queuing.
- **Supply-Chain & Container Scanning**: Run `npm audit`, SBOM generation, secret scanning (`scripts/check-secrets.mjs`), and container vulnerability scanning on every CI pipeline run. Conduct an independent CERT-In empanelled penetration test before go-live.
- **DPDP Act 2023 Alignment**: Collect only the minimum fields required for disaster relief; purge offline queues after 72 hours; scrub PII from application logs (`scrubPii()`); provide a dedicated Data Protection Officer (DPO) workflow for correction and erasure requests once statutory disaster-relief retention ends.
