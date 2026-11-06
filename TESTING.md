# NIVARAN — NDMA-Style Functional Completeness & Acceptance Verification (`TESTING.md`)

**Local Development Server:** [`http://localhost:5173/`](http://localhost:5173/)

## 1. Architecture & Persistence Overview
- **Single Backend Adapter (`src/services/voiceSosBackend.ts` & `src/services/persistentStateAdapter.ts`)**:
  - All operational state (CAP Alert Zones, Voice Alerts, Emergency SOS signals, Shelters & Check-in Registers, Volunteers & Task Assignments, IDRN Resource Inventory & Requests, Field Incidents, Relocation Household Cases, Damage Assessments, Audit Logs, and Mock Drill Mode) is persisted in **IndexedDB** (`nivaran_operational_db_v2` and `nivaran_voice_sos_db_v1`) and broadcast live across open tabs via **`BroadcastChannel('nivaran_operational_sync_v2')`**.
- **6 Top-Level Tabs Only**:
  - `Map | Alerts | Resources | Planning | Impact | Settings`
- **Voice Alert & Emergency SOS**:
  - Separate features, side-by-side buttons (`Voice Alert` in Teal `#0B8F80` + `Emergency SOS` in Red `#B91C1C`), separate screens, separate backend endpoints (`POST /alerts/voice` and `POST /alerts/sos`), and separate Control Room inboxes.

---

## 2. 14-Point End-to-End Acceptance Checklist

| # | Requirement | How to Verify on `http://localhost:5173/` | Status |
|---|---|---|---|
| **1** | **Issue a Red alert for an area; see it appear live in a second open tab; cancel it; see the version history.** | Open `/map` or `/alerts` (`Issued Alerts (CAP)`). Issue a new Red CAP Alert with English & Hindi text and confirm step. Open a second browser tab at `http://localhost:5173/alerts` — the alert appears live via `BroadcastChannel`. Click **Cancel Alert** or **Update / Escalate Level**, and inspect the collapsible **Version History** log on the card. | PASS |
| **2** | **Import a sample CAP alert file and see it on the map and feed.** | On `/alerts` → `Issued Alerts (CAP)`, click **Import CAP XML / JSON**, click **Load Sample IMD Red Alert XML** (or paste custom CAP XML/JSON), and click **Import CAP Alert**. It immediately renders on the feed and `/map`. | PASS |
| **3** | **Send a 10 s Voice Alert as a citizen; play it and acknowledge it in the control room; see the citizen screen update to "Acknowledged".** | Click **Voice Alert** (teal button), record for ~10s, tap **Send**. Switch to `/alerts` → `Voice Alerts` inbox, play the audio waveform, and click **Acknowledge**. The status updates to `Acknowledged` with officer timestamp in both views. | PASS |
| **4** | **Hold the SOS button for 2 s; receive and dispatch in the control room; see the status update.** | Hold the red **Emergency SOS** button for 2 seconds until the progress ring completes. Switch to `/alerts` → `SOS` sub-tab, and click **Acknowledge** or **Dispatch Team**. Status updates live across tabs. | PASS |
| **5** | **Go offline (DevTools), send a Voice Alert and an SOS, see "Queued offline", go back online, see both delivered automatically.** | Toggle DevTools Network → Offline. Send a Voice Alert or SOS. Top bar displays `Offline — will sync (N)` and status shows `Queued Offline (IndexedDB)`. Re-enable network — queue flushes automatically. | PASS |
| **6** | **Acquire GPS, see the accuracy circle and badge, drag the pin manually, see "Location set manually".** | Use the shared GPS widget on `/map` or `/alerts`. Click **Use My Location** to see accuracy meters (`±m`) and `Good / Fair / Poor` badge, or click/drag on the map to set a manual pin (`Location set manually`). | PASS |
| **7** | **Create a shelter, check in 10 people, see occupancy and status update on the map.** | Open `/resources` → `Shelters & Camps`. Click **+ Add New Shelter** or open **Check-In Evacuees** on an existing shelter, enter `Headcount = 10`, and submit. Occupancy and `Available / Filling (80%+) / Full` status update immediately on the card and `/map`. | PASS |
| **8** | **Register a volunteer, approve as officer, assign a task, accept as volunteer, mark done.** | Open `/resources` → `Volunteers`. Click **+ Register as Volunteer**, then as Officer click **Approve**, click **Assign Task**, and click **Accept Task → Start → Mark Done**. | PASS |
| **9** | **Request a resource from the inventory, approve and dispatch, see stock decrease.** | Open `/resources` → `IDRN Inventory`. Click **Request Resource** on any item, enter quantity, submit, then click **Approve & Dispatch** in the Dispatch Queue. Available quantity decreases and triggers `LOW STOCK` warning when ≤20%. | PASS |
| **10** | **Submit a field incident with photo and location, assign a team, resolve it, see the timeline.** | Open `/alerts` → `Incidents & Field Ops`. Click **+ Report Field Incident** (nearby duplicates within 1.5 km are automatically flagged). Assign a response team, progress through `Verified → Response Assigned → In Progress → Resolved`, and expand the timestamped timeline. | PASS |
| **11** | **Compute an evacuation route from an alert zone to the nearest available shelter.** | On `/map`, click **Evacuate Red Zone → Nearest Shelter (OSRM)** in the top bar or inside any Alert Zone popup card. OSRM calculates and draws the road route avoiding Red hazard zones where possible, showing distance (`km`) and ETA (`min`). | PASS |
| **12** | **Advance a relocation household case through all stages and verify the hash chain.** | Open `/planning` → `Relocation Cases`. Click **Advance to <Next Stage>** across all 5 stages (`Surveyed → Approved → Compensation Paid → Site Allotted → Resettled`) and inspect the SHA-256 `prevHash → currHash` chain. | PASS |
| **13** | **Generate and download a SitRep PDF and CSV with real numbers from the current state.** | Open `/alerts` → `SitRep (PDF / CSV)`. Review live computed metrics and click **Download SitRep PDF** or **Export SitRep CSV**. | PASS |
| **14** | **Run a mock drill, see the drill banner, end the drill, and confirm drill items are excluded from real reports.** | Click **Mock Drill** in the top header bar. High-visibility orange banner appears; any new alerts/incidents are tagged `[DRILL]` and excluded from SitRep counts. Click **End Drill** to generate a timestamped `DrillSummaryReport`. | PASS |
