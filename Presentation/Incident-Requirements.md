# Incident Tracker requirements: five incident subjects

Terminology note. This document avoids "V1" and "V2". Ted raised in the Aug 21
launch meeting that those labels read as release versions, and that people would
assume V1 means student incidents only. Nothing has shipped, so there is no
earlier version to compare against: the software is being designed now and this
document specifies part of it. Where scope has to be named, **student incidents
only** describes the narrower shape the module was originally scoped to, and
**five incident subjects** describes what is specified here. V1 refers only to
what ships in November.

For the November launch. Written for the Review Incident Issues group, so dev
and QA can estimate without re-scoping every screen.

Every count below is derived from the working prototype at
`https://captwildguns.github.io/incidents-v2/`, not asserted. Where a
requirement is already demonstrated there, the spec says so, and that build is
the reference for intended behaviour.

**Division of labour, per the Aug 19 meeting.** This document is requirements
and specs. Technical approach, data model and coding estimates are dev's, and
deliberately not prescribed here.

---

## The scope question, answered

The concern raised on Aug 19 was that adding incident subjects doubles the scope
because every screen changes. It does not, and here is the measurement.

The Incident Details step carries **17 distinct fields**. **12 of them are
identical for all five subjects.** Only **5 fields vary at all**, and all five
are governed by one map rather than by per-subject screens.

**The 12 shared fields**, present on every subject:

Incident Type, Severity, Incident Description, Date, Time, Location Type,
Location on map, Witnesses, Third parties, Tags, Photo evidence, Document
evidence.

**The 5 conditional fields**, and where each applies:

- **People roster:** Student, Employee, Third Party. Absent for Vehicle and
  Location.
- **Affected asset:** Vehicle and Location only. This is the only genuinely
  subject-specific field, and it is one control whose label and source change.
- **Vehicle Number:** Student, Employee, Third Party. Absent for Vehicle,
  because the affected asset already names the bus, and absent for Location.
- **Driver:** all except Location.
- **Run:** Student, Employee, Third Party. Absent for Vehicle, since nobody is
  aboard, and absent for Location.

So per subject the delta from the shared set is: Student 4, Employee 4, Third
Party 4, Vehicle 2, Location 1.

**Consequence for estimating:** this is one form with a field map, not five
forms. The prototype implements it as a single ordered field list where an
inapplicable field is not rendered and the fields after it close up.

---

## R1. Incident subjects

**R1.1** An incident has exactly one subject, from a fixed set of five:
Student, Vehicle, Location, Third Party, Employee.

**R1.2** Subject is the first choice when filing and determines which incident
types are offered, which workflow is assigned, whether people must be named,
and how the incident is labelled everywhere else.

**R1.3** Filing must not require a student. Vehicle and Location incidents have
no people on them. The current build blocks progress until a student is added,
which makes four of the five subjects unfileable.

**R1.4** Subject appears as a column on the incidents grid and as a filter.

**R1.5** Subject appears on the incident record.

**R1.6** Access to every subject is governed the same way. There is no
per-subject visibility rule.

Demonstrated: subject chooser, incidents grid Subject column and filter,
incident record Subject field.

---

## R2. The filing form

**R2.1** One form serves all five subjects, with two steps: Incident Details,
then Review and Submit. The current build runs four steps and only for students.

**R2.2** A field never changes position between subjects. Fields that do not
apply are not rendered, and the following fields close up.

**R2.3** Field order follows how a reporter thinks: who, then what, then when
and where, then supporting detail.

**R2.4** Severity is pre-selected from the incident type's default and is
overridable. Changing the type re-applies that type's default.

**R2.5** Date and time of occurrence are captured, and are distinct from the
date the record was created. Neither exists in the current build. Raised twice
in the Aug 19 review and still open in the Aug 20 notes.

**R2.6** The review step names the workflow that will be assigned and the person
who will own the incident, before submission.

**R2.7** Per named person the form captures role in incident, severity for that
person, what they did, action taken, additional notes, and for students whether
a parent or guardian was notified.

**R2.8** Witnesses and third party contacts capture name, phone and email.

---

## R3. Incident types

**R3.1** Twenty delivered types across ten categories. Each belongs to exactly
one subject and carries a default severity.

- **Student, 6:** Disruptive Behavior (Low), Safety Violation (Medium),
  Physical Altercation (High), Property Damage (Medium), Weapon / Prohibited
  Items (Critical), Witness / Bystander Statement (Low)
- **Employee, 4:** Employee Altercation (High), Employee Misconduct (Medium),
  Employee Injury (High), Employee Substance Violation (Critical)
- **Third Party, 4:** Third Party Collision (High), Third Party Injury (High),
  Third Party Conduct (High), Public Complaint (Low)
- **Vehicle, 3:** Vehicle Damage (Medium), Mechanical Failure (Medium), Single
  Vehicle Collision (Medium)
- **Location, 3:** Location Damage (Medium), Utility Failure (Medium), Location
  Safety Hazard (High)

**R3.2** A type belongs to one subject only. "Injury" for both students and
employees is two types.

**R3.3** Two types are non-disciplinary by design, and exist so a record is not
created that unfairly follows someone: Witness / Bystander Statement, and
Public Complaint.

**R3.4** Every type must be covered by at least one workflow. A type with no
workflow files an incident with nowhere to go.

---

## R4. Workflows

**R4.1** Twelve delivered workflows containing forty-six steps, selected
automatically from incident type and severity. Six cover the student types and
six cover the rest: Employee Conduct Review, Employee Injury Report, Location
Issue Response, Vehicle Damage and Mechanical Response, Third Party Incident
Response, Public Complaint Review.

**R4.2** Every step assignment uses one of the seven incident roles in
`IncidentRoleType`: Driver, Safety Coordinator, Administrator, Fleet Manager,
Mechanic, School Principal, Nurse.

**R4.3** A workflow carries an **owner role**, and an incident filed against it
is assigned to whoever holds that role at the moment of creation. The owner does
not change as the workflow advances, which is what makes an assigned-to-me view
stable. A named person may override the role.

**R4.4** Incident Owner is a **required field in the workflow builder**. A
workflow cannot be saved without one, so every workflow resolves to an assignee
and no incident is filed unassigned. The builder shows the resolved person under
the field, and the Workflows grid shows the resolved person with the role
beneath it.

**R4.5** The builder can also name **a specific person** instead of a role. That
overrides the role, so the assignment does not follow a change of staff. The
role stays required, since it is what governs permission.

**R4.6** The person filing an incident can assign it. **Assigned To** on the new
incident form defaults to the workflow owner and names who that resolves to, for
example "Workflow default (Jane Doe)". It can be changed to any employee holding
an incident role. An override applies to that incident only and does not change
the workflow. Review and Submit states which of the two applied.

**R4.7** Six of the forty-six steps require an approval. All forty-six use a
manual trigger, so automation is opt-in.

---

## R5. Terms

**R5.1** The incident record shows the term the incident occurred in. Raised
four times in the Aug 19 review.

**R5.2** The incidents list separates prior years, so older incidents read as
their own block rather than blending into the current year.

**R5.3** The same separation applies to a student's incident history.

**R5.4** Open question for dev, not specified here: whether counts and lists are
term-scoped by default, and whether incidents from past terms are reachable.
Jon confirmed the data supports it via `IncidentEventStudent` joining to
Student.

---

## R6. People and places

**R6.1** The Drivers page becomes **Employees** and includes non-driver staff:
aides, mechanics, dispatchers, yard supervisors, fleet managers. Any of them can
be the subject of an incident.

**R6.2** Job role is a filterable attribute, and is distinct from incident role.

**R6.3** Driver-specific detail such as licence number, class, expiry, assigned
vehicle and default garage appears only for drivers.

**R6.4** A **Locations** page exists: depots, garages, yards and administration
buildings, with address, phone, manager, in-service date, and derived counts of
vehicles, employees and incidents.

**R6.5** A location or vehicle referenced by an incident is a reference, not a
stored name. Renaming one must not orphan its incidents.

---

## R7. Finding incidents

**R7.1** The incidents list filters by Subject, which is the only practical way
to find a record when you do not know a person's name.

**R7.2** Per-column filters that apply as you type, on Incident ID, Date,
Involved, Subject, Type, Severity, Status, Assigned To.

**R7.3** The Involved column is subject-aware. A Location incident shows the
location, a Vehicle incident the vehicle. The prototype shows only students in
that column.

**R7.4** Students, Employees, Locations and Vehicles each show an incident count
that opens the incidents behind it.

**R7.5** Drill-through is by identity, not by free-text name match. Two people
sharing a surname must not return each other's incidents.

---

## R8. The record

**R8.1** The record shows Subject, Type, Occurred as date and time, Term,
Location, Severity, **Status**, Assigned To and Description. Status appears on
both grids in the prototype but on no record, so the record has to carry it.

**R8.2** Fields that do not apply to the subject are not shown, and fields with
no value are not shown as empty labels.

**R8.3** Non-student parties are supported on the record with the same detail as
students, minus parent notification.

**R8.4** Tags, witnesses, third parties and both evidence types appear on the
record.

**R8.5** Photos and Documents are always present with a count, so an incident
with no evidence is a fact you can see.

---

## R9. Dashboard and communications

**R9.1** An **Incidents by Subject** chart, which is the one view that answers
how much of the workload is not about a student.

**R9.2** Keep Incidents by Driver, which the current build has and which Seana
asked for specifically.

**R9.3** Every dashboard number derives from the incidents themselves, so the
dashboard and the grids cannot disagree.

**R9.4** Communications resolve the counterparty from the subject: a Location
incident corresponds with the location manager, a Vehicle incident with the
fleet manager, an Employee incident with the named employee.

**R9.5** Communications filter by Subject.

---

## Requested but not specified, needs a decision

Raised by stakeholders and not yet turned into requirements. Listed so they are
not lost, and so nobody estimates them by accident.

- **Nurses and counsellors filing incidents.** Seana, Aug 19. Explicitly not
  teachers. No non-office filing path exists except the driver tablet.
- **A TBD or tentative option for Role in Incident.** Seana. Reporters often do
  not know a role at filing, and the current set forces a definite answer.
- **A campus-scoped view** so a school administrator sees incidents for their
  own campus. Nothing in this document specifies a school filter.
- **State-reportable incidents**, weapons in particular. Whether tags can carry
  this and be reported on.
- **Aides and monitors associated with a run.**
- **Assigned Groups in workflows:** how people get into them and whether more
  can be created.
- **"Assigned Driver" on Vehicles** should read Default Driver, since the
  vehicle default and the run assignment are different people.

---

## Known gaps in the prototype

Stated so the prototype is not mistaken for complete.

- Reports runs on its own private incident list, so its numbers agree with
  nothing. Deliberately out of scope.
- A location or vehicle is referenced by name, not by id. This is R6.5 and is
  not yet implemented.
- Drill-through is a name search, not an identity filter. This is R7.5 and is
  not yet implemented.
- Witness and third party contacts have no description field, so a person nobody
  can name cannot be described.
