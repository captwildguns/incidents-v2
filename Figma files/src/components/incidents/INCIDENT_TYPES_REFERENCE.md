# Incident Types Reference

Canonical source: `IncidentTypes.ts`. This document describes what is in that
file; if the two disagree, the code is correct.

## Subjects

Every incident has exactly one **subject**, which is what the incident is
fundamentally about. The subject drives which steps the New Incident wizard
shows, which incident types are offered, and which workflow is assigned.

- **Student** — one or more students involved
- **Vehicle** — bus damage or a mechanical problem with nobody aboard
- **Location** — a depot, garage, or yard problem such as a burst pipe or power loss
- **Third Party** — another motorist, a pedestrian, a parent, or a member of the public
- **Employee** — employees only, such as a dispute between drivers or an injured aide. Access is governed by the same resource grants as every other subject; there is no per-subject visibility rule.

## Incident types by subject

### Student (6)
- **Disruptive Behavior** — offensive language, noise, harassment, bullying, refusal of driver directives *(Low)*
- **Safety Violation** — seat or seatbelt refusal, unsafe movement, emergency exit misuse, wrong stop exit *(Medium)*
- **Physical Altercation** — fighting, assault, throwing objects, threats *(High)*
- **Property Damage** — vandalism or damage requiring restitution *(Medium)*
- **Weapon / Prohibited Items** — weapon, tobacco, vaping, illegal substances, prohibited materials *(Critical)*
- **Witness / Bystander Statement** — non-disciplinary record of a student who witnessed or helped. Use this instead of adding a bystander to a disciplinary incident, so their record is not flagged for behavior they were not part of *(Low)*

### Vehicle (3)
- **Vehicle Damage** — damage with nobody aboard, such as a clipped mirror or hail *(Medium)*
- **Mechanical Failure** — breakdown or fault taking a vehicle out of service *(Medium)*
- **Single Vehicle Collision** — strikes a fixed object with nobody aboard *(Medium)*

### Location (3)
- **Location Damage** — damage or vandalism to a depot, garage, or yard *(Medium)*
- **Utility Failure** — burst pipe, power outage, heating failure *(Medium)*
- **Location Safety Hazard** — fuel spill, icy walkway, blocked fire exit, exposed wiring *(High)*

### Third Party (4)
- **Third Party Collision** — collision or near miss with another motorist or cyclist *(High)*
- **Third Party Injury** — pedestrian, motorist, or member of the public injured *(High)*
- **Third Party Conduct** — aggressive or abusive behavior by a parent, guardian, or member of the public *(High)*
- **Public Complaint** — non-disciplinary record of a complaint about a vehicle, route, or driver *(Low)*

### Employee (4)
- **Employee Altercation** — physical or verbal altercation between employees *(High)*
- **Employee Misconduct** — policy violation, insubordination, unprofessional conduct *(Medium)*
- **Employee Injury** — employee injured on duty *(High)*
- **Employee Substance Violation** — suspected under the influence, or possession on duty *(Critical)*

## Totals

20 incident types across 5 subjects and 10 categories.

Categories: Behavioral, Safety, Aggression / Violence, Property, Prohibited,
Informational, Employee Conduct, Location, Mechanical, Collision.

## Related fields

- `involvedStudents[]` — present on student incidents. Carries per-student role, severity override, type override, parent notification, and the `noWorkflow` bystander flag.
- `involvedParties[]` — the non-student equivalent, deliberately the same shape. Present on employee and third party incidents.
- `assetRef` — names the affected location or vehicle. Location and vehicle incidents may carry no people at all, so this is what identifies the record.
- `date` and `time` — when the incident **occurred**, entered by the reporter.
- `reportedDate` — when the report was **filed**, stamped by the system. Deliberately separate, because reports routinely arrive at the end of a run or the next morning.

## Workflows

Every incident type maps to a workflow by **label** (not id) via
`assignWorkflowToIncident` in `src/data/workflows.ts`. Non-student subjects have
their own workflows (WF-007 through WF-012); WF-004 Property Damage is
deliberately not reused for location or vehicle damage because its later steps
are parent restitution and principal discipline.
