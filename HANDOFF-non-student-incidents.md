# Handoff: non-student incident subjects (GH #191, #196, #197)

Rewritten 2026-08-20. Branch `non-student-incident-subjects`, 30 commits since
the previous handoff at `cf7253f`. Working tree clean, build green, **nothing
pushed**. Nothing has been posted to GitHub or Monday.

The previous version of this file described the state at `cf7253f`. That is all
superseded.

## Where the work stands

Every page on the site is now subject-aware and runs off derived data with one
source of truth, with one deliberate exception.

Done this session, by area:

**Grids.** Incident counts on the vehicles, employees and students grids derive
from `mockIncidents` instead of stale seeded scalars. Counts are clickable and
open the incidents grid scoped to that entity. Search on every grid matches the
fields its placeholder promises, and all four grids share one Forge typeahead
(`components/shared/EntitySearchField.tsx`).

**Vocabulary.** Facility became Location and Staff became Employee across the
subject union, labels, categories, type ids and labels, form, tablet, detail
page, workflows and the reference doc. Decided Aug 12, carried through here.

**Workflow roles.** The four invented roles (Transportation Supervisor, HR
Manager, Facilities Manager, Maintenance Manager) are gone. All 46 step
assignments use one of the seven `IncidentRoleType` members, so #188 stays a
five GUID procedure.

**New incident form.** Rebuilt as one container
(`NewIncidentFormUnified.tsx`), the only new-incident form left. Identical
two-step flow for all five subjects, one continuous field sequence, severity
auto-assigned from the incident type.

**Pages.** Drivers became Employees with a job role filter and non-driver
staff. A Locations page was added. Communications became subject-aware with a
derived counterparty and a Subject filter. The dashboard's charts and KPIs are
derived rather than hardcoded.

**Workflow ownership.** Workflows carry an `ownerRole` that routes new incidents
to whoever holds it, with an optional named override.

## Decisions that are easy to reverse and worth knowing

- **Sequence, not sections.** The who, what, when-and-where order in the new
  incident form is about the order a reporter thinks in. It is deliberately not
  three headed sections; that was tried and rejected.
- **Witnesses and third parties are selects, not checkboxes.** Only way to make
  them match the other fields. Revert if the checkbox convention matters more.
- **Changing incident type re-applies its default severity**, discarding a
  manual override. The type is the bigger decision.
- **Role badges on the Employees grid are all one theme.** Job role is a
  category, not a status.
- **Locations includes two locations nothing references** (Transportation
  Administration, West Bus Yard). They exercise the zero case; drop them if they
  read as noise.
- **Reports is deliberately untouched.** Out of scope by instruction.

## Open items

1. **Reports runs on its own private incident list.** `ReportsPage.tsx` declares
   a local `mockIncidents` of 20 rows, none carrying a subject, shadowing the
   shared one. Every number on that page is fiction and cannot agree with
   anything else. Four open issues sit on it (#183, #184, #185, #186). Left
   alone by instruction, but it is the largest known inconsistency on the site.

2. **#196 gap: `assetRef` is a name, not a reference.** A Location incident
   stores the location's name as a string, so renaming a location orphans every
   incident that named it. #196's first acceptance criterion. Noted in a comment
   at the top of `data/locations.ts`.

3. **#196 gap: drill-through is a name search, not an identity filter.** Clicking
   an incident count pushes the entity's name in as free text. Fine for a bus
   number, over-matches on people: two employees sharing a surname return each
   other's incidents. Also means a single-digit bus name is a prefix of the
   two-digit ones (Bus 1 has no incidents today, so nothing is clickable, but it
   would over-match if it got one).

4. **#197 is ahead of its own gate.** Workflow ownership is built, but #197 says
   the design should be confirmed against the Cy-Fair discovery on how that
   district actually assigns incidents. That session is not scheduled.

5. **#114 closed without a Subject filter.** Still not reopened, still not
   commented on. The reverse-lookup work this session strengthens the argument.

6. **#191 item 2 not built.** Description on witness and third party contacts, so
   a person nobody can name can still be filed. The smallest of the three items
   on the #191 "left to build" list; items 1 and 3 are done.

7. **The Tuesday Aug 25 package.** BK asked for a final V1 issue list, the shared
   versus specific field inventory, an inventory of the issues that were updated
   rather than created, and all of it on the Monday board. Only the field
   inventory exists, in `Presentation/Incident-Form-Approach.md`. This is the
   only outstanding item with a hard date.

8. **Older, unchanged from the last handoff:** Kristen Michalski unanswered since
   2026-08-13 on PR #19990; Seana Baughman's OneDrive access request from
   2026-08-18; the Cy-Fair demo request that BK owns; the blank-student-column
   bug that probably still lives in the SSRS report outside this repo.

## Gotchas

- **TypeScript is not installed.** `npm run build` transpiles without
  typechecking, so type errors ship as wrong behaviour rather than failing the
  build. Build after every structural edit and verify in the browser.
- **A green build proves almost nothing about behaviour.** Three of this
  session's real defects (stale workflow on the detail page, `undefined` in
  global search, the vehicle chart disagreeing with the vehicles grid) were only
  found by clicking through. Walk the five subjects.
- **The password gate is `My-Drop-Site`, hardcoded at `src/App.tsx:20`.** It is
  per-tab sessionStorage, so a new tab always hits it. Claude will not type it;
  a human has to unlock the tab.
- **The slideout nav is unreliable under scripted clicks.** Open it, screenshot
  to get real positions, then click. The global search in the header is a more
  reliable way to reach an incident.
- **Import cycles around `IncidentsPage`.** It imports the incident form and the
  form imports several pages, so anything exported from `IncidentsPage` has to be
  read inside a component to dodge its temporal dead zone. Roster and location
  data were moved into `data/` this session to remove that hazard; `mockIncidents`
  still has it.
- **Node is not on PATH by default:**
  `export PATH="/c/Program Files/nodejs:/c/Users/Gabe.guzman/AppData/Roaming/npm:$PATH"`
- **GitHub Pages is not configured** for `captwildguns/incidents-v2`. The app runs
  only at `http://localhost:3000/incidents-v2/` via `npm run dev`.
- **The driver tablet has no URL.** It is `currentPage === 'tablet'`, reached by
  clicking the avatar at the top of the slideout drawer.
- **Teams search rate-limits (Graph 429)** when date filters are used. The
  non-date path usually works.

## Seed data reconciliations made this session

Worth knowing, because the numbers moved and any screenshot taken before this is
stale:

- 54 incidents. Added `INC-2025-0070`, an aide injured on a wheelchair lift, so
  the Employee subject is exercised by a non-driver.
- Added VEH-004, 006, 010, 011, which `mockDrivers` referenced but `mockVehicles`
  did not have. Bus 22 and Bus 31 on two incidents were repointed to real buses.
- Two employee party ids on `INC-2025-0065` pointed at the wrong people. Fixed,
  and counts now match on name rather than id.
- 47 students. Chris Park, `STU-3890`, was a named bystander with no student
  record.
- Student incident counts now derive from `mockIncidents`, which dropped 13 stale
  entries using retired type names. Totals moved from 61 to 55 and repeat
  offenders from 5 to 1.
- The dashboard's vehicle chart agrees with the vehicles grid for the first time:
  Bus 8 is 10 and Bus 15 is 10.
