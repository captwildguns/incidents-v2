# Incident form: field inventory and approach

Draft for the Tuesday Aug 25 regroup. Written 2026-08-19 after the Review
Incident Issues meeting.

Answers the two things asked for in that meeting: the list of fields, and a
decision on whether each incident subject needs its own experience or whether
one container with shared and specific fields does the job.

## The short answer

The form is already almost entirely shared. Counted from the built prototype,
**14 of 15 fields on the Incident Details step are identical for all five
subjects.** Exactly one field and one section vary.

That means the container approach is not a rewrite of five screens into one. It
is mostly a matter of making the shared 90% look shared, which today it does
not, because the sharing is implemented as branches and the flow length differs
by subject.

## Fields shared across all five subjects

Required:

1. Incident Date, defaults to today, cannot be future
2. Incident Time, deliberately blank rather than prefilled
3. Incident Type, options filtered by subject
4. Severity
5. Incident Description
6. Location Type, where it happened: on vehicle, at a stop, garage, yard, fuel
   station, wash bay, school campus, parking lot, layover, other

Optional:

7. Vehicle Number
8. Driver
9. Run
10. Witnesses present, each with name, phone, email, description
11. Third parties involved, each with name, phone, email, description
12. Tags
13. Photo evidence
14. Document evidence
15. Map pin, with coordinates and resolved address

Field 7, Vehicle Number, is shared by four of the five. It is suppressed on a
Vehicle incident because Affected Vehicle already captures it, and asking twice
invites the two to disagree.

## Fields specific to a subject

One field:

- **Affected asset**, required. Reads Affected Vehicle on a Vehicle incident and
  Affected Location on a Location incident. Same control, same position,
  different label and option source. Absent on the other three subjects.

One section:

- **People involved**, required on three of five. Same shape every time: a
  roster of people, each carrying role (Participant, Witness, Reporter,
  Injured), a severity, a description, an action taken, and notes.
  - Student incident: students, picked from the student roster
  - Employee incident: employees, picked from the driver roster
  - Third Party incident: outside people, entered as free text
  - Vehicle and Location incidents: absent, there is nobody to name

So in the format asked for in the meeting: **15 shared fields, 1 subject-specific
field, 1 subject-specific section.** There is no subject with three or four
fields of its own.

## What actually differs today, and why it reads as five experiences

The field list is nearly identical, but the prototype still feels
subject-specific for three reasons, none of which are about the data:

1. **The flow length changes.** Student, Employee, and Third Party run four
   steps: people, details, per-person details, review. Vehicle and Location run
   two: details, review. A reviewer clicking through all five sees five
   different-looking wizards.
2. **Fields move between subjects.** On a Location incident, Incident Type is
   relocated down beside Affected Location, and Date and Time re-split the row
   50/50. So the same field sits in a different place depending on subject, which
   is the specific thing the meeting said it did not want.
3. **The roster is implemented twice.** Students use one code path and data
   shape, employees and third parties use a parallel one that captures the same
   things. Two implementations of one concept, which is why every change to the
   roster has to be made twice.

## Recommended approach

Adopt the container. Concretely:

- **One fixed field sequence for every subject**, ordered by how critical the
  data is rather than by how the old wizard happened to be laid out: who or what
  was involved, what happened, when and where, then the optional detail. A
  reporter knows who an incident involves and what happened before they work out
  the operational context, and the narrative is the most valuable field in the
  record, so neither it nor the roster belongs near the bottom.

  Sequence, not sections. The fields run continuously with no interior
  headings; the order is about the order a reporter thinks in, not about
  carving the form into labelled blocks.
- **One ordered field list, flowed into a grid.** The order is the same on every
  subject. A field the subject does not need is not rendered and the ones after
  it close up, so the grid is always fully packed. This is the MyRide container
  behaviour from the meeting: if one disappears it does not change the entire UI,
  that field is just no longer there. Reserving the empty slot to keep neighbours
  in place was tried first and left a visible hole.
- **Stop relocating Incident Type.** It stays in the same slot on all five.
- **People Involved becomes one section, not a step**, always in the same place,
  with the label changing between Students, Employees, and People, and the
  section hidden entirely for Vehicle and Location.
- **Per-person detail becomes an expandable row inside that section** rather than
  its own step. This is what lets all five subjects run the same two steps.
- **One roster implementation**, with the student path folded into it.

Result: every subject runs an identical two-step flow, Details then Review. The
step count stops varying, which removes the largest source of the
five-experiences impression.

## What this costs

Honest accounting, since the meeting asked whether this is more work now or less
work later.

More work now:

- The per-person step becomes an inline expandable section, which is real UI work
  and the least certain part of this proposal. Multiple students with individual
  narratives is the case that justified a dedicated step in the first place.
- Merging the two roster implementations touches the student path, which is the
  one path that already works and that nothing in this change is meant to alter.

Less work later:

- One screen to change instead of five when a field is added.
- New subjects become configuration rather than a new wizard.
- The requirement spec collapses to one field list plus two exceptions, which is
  what dev asked for.

## Where to see it

The container version is the new-incident form in the prototype, reachable from
New Incident on the incidents grid or the New Incident page. It contains nothing
that would not ship: no design-comparison toggle, no reviewer commentary in the
help text, no browser confirm dialogs.

The previous multi-step version has been deleted. It is recoverable from git
history if the group prefers it: it was last referenced at commit 2ae4a1d and
the file is NewIncidentForm.tsx.

## How this consolidates the tickets

The reason to settle the field inventory first is that it changes the shape of the
backlog. Right now items are being written per screen, per subject, and per
field, which is what produces a hundred small items nobody can estimate as a
whole.

With one shared field set and two variations, the same work is four tickets
instead of dozens:

1. **Incident form container, shared field set.** One screen, the 15 shared
   fields, one validation spec. Replaces every "add field X to subject Y's form"
   item, because there is only one form.
2. **Subject-specific slots.** The affected asset field and the people-involved
   section, which are the only two things that vary. Carries the label and option
   source per subject.
3. **Unified two-step flow.** Collapse the four-step and two-step paths into one.
   Replaces the per-subject flow items.
4. **Single roster implementation.** Fold the student path into the shared one.
   Replaces every "also do this for students" follow-up.

Two things fall out of the backlog entirely rather than being built: per-subject
mockups, and the per-subject relocation of Incident Type.

The estimate conversation then happens once per ticket against a known field
list, which is what dev asked for, instead of once per small item against a
screenshot.

## Open questions for the group

1. Two steps for everyone, or keep a dedicated per-person step for Student
   incidents only? The second is a smaller change but reintroduces a
   subject-specific flow length.
2. Does Vehicle Number stay suppressed on a Vehicle incident, or become a
   read-only field derived from Affected Vehicle so the slot never empties?
3. Cy-Fair feedback was named as an input to this decision and that meeting is
   not scheduled yet. Does the approach get finalized Tuesday regardless, or
   held for them?
