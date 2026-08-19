# Handoff: non-student incident subjects (GH #191)

Written 2026-08-19. Work is committed on branch `non-student-incident-subjects`
(commit `667fe2d`), branched from `main` at `7a2d468`. Nothing is pushed.

## State

All 11 planned tasks are done and the build is green (`npm run build` from
`Figma files`). The original plan lives at
`C:\Users\Gabe.guzman\.claude\plans\lets-talk-about-changing-atomic-hamster.md`.

I posted a progress comment on #191:
https://github.com/tyler-technologies/transportation-incidents/issues/191#issuecomment-5269037250
Screenshots for it are in `issue-191-screenshots/`. Gabe was going to drag them
into the comment, replacing the four `_[screenshot N: ...]_` placeholders.

## Open items for the 11:30 meeting (Review Incident Issues, BK + Justin)

1. **#114 closed without a Subject filter.** Closed 2026-08-18 14:59 as
   completed. Without it you cannot isolate facility incidents or keep staff
   records out of a student view, which several #191 acceptance criteria assume.
   The Type filter on that card may also still be hardcoded to the six student
   labels, which would leave all 14 new types unfilterable. Suggested action was
   to reopen #114 with a comment rather than file new work. Nothing posted.

2. **#188 role seeding.** Assigned to Jon Jungman. Creates
   `SeedIncidentWorkflowDefaults`, seeding Incident role GUIDs into step
   templates and workflows. The four new non-student roles (Transportation
   Supervisor, HR Manager, Facilities Manager, Maintenance Manager) must exist
   in that proc or the non-student workflows ship with no valid assignee.

3. **Export moved to SSRS PDF for V1** (Jon, #117, 2026-08-18). CSV and Excel
   deferred to V2. The CSV export here was repaired to stop emitting `undefined`
   for non-student rows; that same blank-student-column bug very likely now
   lives in the SSRS report, which is outside this repo.

4. **Cy-Fair demo request.** Cheryll Hill replied 2026-08-18 that Dr Smith,
   herself, and new Assistant Director Tamra Besch all want to see the product.
   Cy-Fair is one of the two districts #191 cites as driving non-student
   incidents. BK owns the thread.

5. **Kristen Michalski, unanswered since 2026-08-13.** David assigned her PR
   #19990 (Incident dashboard reporting sprocs), labeled `qa: not needed`, and
   she asked whether there is anything she should actually be testing. She
   flagged it as not pressing. A draft reply was offered but never written.

6. **Seana Baughman requested access** to the "Incidents Training Review"
   meeting recording in Gabe's OneDrive (2026-08-18 17:37). Needs Gabe to
   accept or decline.

## Deliberately not done

- The stakeholder doc the plan asked for first,
  `Presentation/Non-Student-Incidents.md`. Gabe chose code first. Writing it now
  against what shipped would be more accurate than writing it from the plan.
- School filtering and the studentless bypass: backend concerns, no auth layer
  in the prototype.
- Staff visibility restriction was **removed entirely** at Gabe's direction.
  Access is governed the same as any other subject; the `restricted` field is
  gone from the subject model, not just hidden.
- Role list is still duplicated across `StepConfigDialog`,
  `WorkflowBuilderPage`, and `StepTemplateManager`. Kept in sync and commented;
  consolidating is a separate cleanup.

## Gotchas for whoever picks this up

- **TypeScript is not installed.** `npm run build` transpiles without
  typechecking, so type errors ship as wrong behavior rather than failing the
  build. Build after every structural edit and verify in the browser.
- **Vite HMR white-screens on a compile error and does not self-recover.** If
  the app goes blank, hard reload (Ctrl+Shift+R) before assuming it is broken.
- **The prototype has a password gate**, `My-Drop-Site`, hardcoded at
  `src/App.tsx:20`.
- **Node is not on PATH by default.** Use:
  `export PATH="/c/Program Files/nodejs:/c/Users/Gabe.guzman/AppData/Roaming/npm:$PATH"`
- **GitHub Pages is not configured** for `captwildguns/incidents-v2`, despite
  the URL in CLAUDE.md. There is no gh-pages branch and the Pages API 404s. The
  app runs only at `http://localhost:3000/incidents-v2/` via `npm run dev`.
- **The driver tablet has no URL.** No router; it is `currentPage === 'tablet'`
  reached by clicking the avatar at the top of the slideout drawer.
- **Teams search rate-limits (Graph 429)** when date filters are used, because
  that path scans up to 50 chats. The non-date search path usually works.

## Last few form changes (unverified visually)

The password gate blocked browser verification for these, so they are built and
committed but never seen running:

- Incident type description is now a `title` tooltip, not inline copy, in both
  the shared picker and the per-student override
- Facility incidents: Date and Time split 50/50, Incident Type moved down beside
  Affected Facility
- Vehicle incidents: Vehicle Number dropdown removed (Affected Vehicle already
  captures it), Driver moved up beside Affected Vehicle
- Location Type flat alphabetical, category groups dropped
- Removed the helper lines under Date, Time, and Run
- Subject added as a sortable column on the incidents grid

Worth eyeballing the facility path first: all of these stack up there.
